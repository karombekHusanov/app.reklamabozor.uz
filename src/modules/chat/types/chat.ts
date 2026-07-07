import type { Category } from '@/modules/agent/types/agent'
import type { OrderStatus } from '@/modules/orders/types/order'

export interface ChatMessage {
  id: number
  sender_id: number
  body: string
  read_at: string | null
  created_at: string
}

export interface Chat {
  id: number
  order_id: number
  order: {
    id: number | null
    title: string | null
    status: OrderStatus | null
    category: Category | null
  }
  other_participant: {
    id: number
    name: string
    company_name: string | null
  }
  last_message?: ChatMessage | null
  unread_count: number
  created_at: string
  updated_at: string
}

/** GET /orders/{order}/chat payload. */
export interface ChatThread {
  chat: Chat
  messages: ChatMessage[]
}
