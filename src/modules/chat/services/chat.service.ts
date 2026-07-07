import { api } from '@/core/api/client'
import type { ApiSuccess } from '@/core/types/api'
import type { Chat, ChatMessage, ChatThread } from '@/modules/chat/types/chat'

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

export async function sendMessage(orderId: number, body: string): Promise<ChatMessage> {
  const { data } = await api.post<ApiSuccess<ChatMessage>>(
    `/api/v1/orders/${orderId}/chat/messages`,
    { body },
  )

  return data.data
}
