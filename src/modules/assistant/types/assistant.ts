/** One turn of the visible conversation (system turns are server-side only). */
export interface AssistantMessage {
  role: 'user' | 'assistant'
  content: string
}

/** Order draft the assistant produced, already validated by the backend. */
export interface AssistantDraft {
  category_id: number | null
  category_name: string | null
  title: string
  description: string
}

export interface AssistantReply {
  reply: string
  draft: AssistantDraft | null
}
