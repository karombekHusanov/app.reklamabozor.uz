import type { Category } from '@/modules/agent/types/agent'
import type { OrderStatus } from '@/modules/orders/types/order'

/** A file attached to a chat message (image or document). */
export interface ChatAttachment {
  id: number
  url: string
  original_name: string
  mime_type: string | null
  size: number
  created_at?: string
}

export interface ChatMessage {
  id: number
  sender_id: number
  body: string
  attachments?: ChatAttachment[]
  read_at: string | null
  created_at: string
}

export type ChatType = 'order' | 'direct'

export interface Chat {
  id: number
  type: ChatType
  order_id: number | null
  order: {
    id: number | null
    title: string | null
    status: OrderStatus | null
    category: Category | null
  } | null
  other_participant: {
    id: number
    name: string
    company_name: string | null
    agent_profile_id: number | null
  }
  last_message?: ChatMessage | null
  unread_count: number
  created_at: string
  updated_at: string
}

/** GET /orders/{order}/chat or /direct-chats/{id} payload. */
export interface ChatThread {
  chat: Chat
  messages: ChatMessage[]
}

// ---- Global (community-wide) chat ----

export interface GlobalChatSender {
  id: number
  name: string
  username: string | null
  role: string
  company_name: string | null
  /** Set only for approved agencies — the public in-app profile target. */
  agent_profile_id: number | null
}

export interface GlobalChatMessage {
  id: number
  body: string
  attachments?: ChatAttachment[]
  created_at: string
  sender: GlobalChatSender
}

/** GET /chat/global payload — composer state for the current user. */
export interface GlobalChatMeta {
  enabled: boolean
  max_message_length: number
  pinned_message: string | null
  pinned_at: string | null
  me: {
    banned: boolean
    ban_expires_at: string | null
    cooldown_seconds: number
    next_allowed_at: string | null
  }
}
