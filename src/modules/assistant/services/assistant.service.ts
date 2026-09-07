import { api } from '@/core/api/client'
import { currentToken } from '@/core/lib/token-storage'
import type { ApiSuccess } from '@/core/types/api'
import type { AssistantMessage, AssistantReply } from '@/modules/assistant/types/assistant'

/** The backend caps history too — trimming here keeps the request small. */
export const MAX_HISTORY = 12

/** Thrown when the feature is not switched on yet (backend answers 503). */
export class AssistantUnavailableError extends Error {}

/**
 * One assistant turn, non-streaming. Kept as the fallback for WebViews without
 * readable fetch bodies. Errors are handled by the page (a chat needs inline
 * feedback, not a global toast), so the interceptor stays quiet.
 */
export async function sendAssistantMessage(messages: AssistantMessage[]): Promise<AssistantReply> {
  const { data } = await api.post<ApiSuccess<AssistantReply>>(
    '/api/v1/assistant/chat',
    { messages: messages.slice(-MAX_HISTORY) },
    { skipErrorToast: true },
  )

  return data.data
}

/** True when this WebView can read a response body as it arrives. */
export function supportsStreaming(): boolean {
  return typeof TextDecoder !== 'undefined' && typeof ReadableStream !== 'undefined'
}

/**
 * Streamed turn (SSE over fetch — EventSource can't POST or carry the auth
 * header). `onDelta` fires per chunk; the resolved value is the final reply
 * plus the server-validated draft.
 */
export async function streamAssistantMessage(
  messages: AssistantMessage[],
  onDelta: (text: string) => void,
  signal?: AbortSignal,
): Promise<AssistantReply> {
  const base = import.meta.env.VITE_API_BASE_URL ?? ''
  const token = currentToken()

  const response = await fetch(`${base}/api/v1/assistant/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ messages: messages.slice(-MAX_HISTORY) }),
    signal,
  })

  if (response.status === 503) {
    throw new AssistantUnavailableError('Assistant is not enabled')
  }

  if (!response.ok || !response.body) {
    throw new Error(`Assistant stream failed with status ${response.status}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let result: AssistantReply | null = null
  let failure: string | null = null

  // SSE frames are separated by a blank line; a frame carries `event:` + `data:`.
  const consume = (frame: string) => {
    const event = /^event:\s*(.+)$/m.exec(frame)?.[1]?.trim()
    const raw = /^data:\s*(.+)$/m.exec(frame)?.[1]
    if (!event || !raw) return

    const payload = JSON.parse(raw) as { text?: string, reply?: string, draft?: AssistantReply['draft'], message?: string }

    if (event === 'delta' && payload.text) onDelta(payload.text)
    if (event === 'done') result = { reply: payload.reply ?? '', draft: payload.draft ?? null }
    if (event === 'error') failure = payload.message ?? 'error'
  }

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    let split = buffer.indexOf('\n\n')
    while (split !== -1) {
      consume(buffer.slice(0, split))
      buffer = buffer.slice(split + 2)
      split = buffer.indexOf('\n\n')
    }
  }

  if (buffer.trim()) consume(buffer)

  if (failure) throw new Error(failure)
  if (!result) throw new Error('Assistant stream ended without a reply')

  return result
}
