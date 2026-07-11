import { api } from '@/core/api/client'
import type { ApiSuccess } from '@/core/types/api'
import type { Chat, ChatMessage, ChatThread, GlobalChatMessage, GlobalChatMeta } from '@/modules/chat/types/chat'

export async function fetchChats(): Promise<Chat[]> {
  const { data } = await api.get<ApiSuccess<Chat[]>>('/api/v1/chats')

  return data.data
}

export async function fetchThread(orderId: number): Promise<ChatThread> {
  const { data } = await api.get<ApiSuccess<ChatThread>>(`/api/v1/orders/${orderId}/chat`)

  return data.data
}

/** Poll for messages newer than the given id (fetches everything when omitted). */
export async function fetchMessages(orderId: number, afterId?: number): Promise<ChatMessage[]> {
  const { data } = await api.get<ApiSuccess<ChatMessage[]>>(
    `/api/v1/orders/${orderId}/chat/messages`,
    { params: afterId ? { after: afterId } : undefined },
  )

  return data.data
}

export async function sendMessage(orderId: number, body: string, fileIds: number[] = []): Promise<ChatMessage> {
  const { data } = await api.post<ApiSuccess<ChatMessage>>(
    `/api/v1/orders/${orderId}/chat/messages`,
    { body: body || undefined, file_ids: fileIds.length > 0 ? fileIds : undefined },
  )

  return data.data
}

// ---- Global (community-wide) chat ----

export async function fetchGlobalMeta(): Promise<GlobalChatMeta> {
  const { data } = await api.get<ApiSuccess<GlobalChatMeta>>('/api/v1/chat/global')

  return data.data
}

export async function fetchGlobalMessages(params?: { after_id?: number, before_id?: number }): Promise<GlobalChatMessage[]> {
  const { data } = await api.get<ApiSuccess<GlobalChatMessage[]>>('/api/v1/chat/global/messages', { params })

  return data.data
}

export async function sendGlobalMessage(body: string, fileIds: number[] = []): Promise<GlobalChatMessage> {
  const { data } = await api.post<ApiSuccess<GlobalChatMessage>>(
    '/api/v1/chat/global/messages',
    { body: body || undefined, file_ids: fileIds.length > 0 ? fileIds : undefined },
  )

  return data.data
}
