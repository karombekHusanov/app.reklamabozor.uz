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
  /** text | offer_price_changed | offer_accepted */
  type?: string
  body: string
  meta?: Record<string, unknown> | null
  attachments?: ChatAttachment[]
  read_at: string | null
  created_at: string
}

export type ChatType = 'order' | 'direct'

export interface ChatActiveOffer {
  id: number
  order_id: number
  order_title: string | null
  price: string | number | null
  status: string
  is_interest?: boolean
  can_edit_price: boolean
  price_edits_remaining: number
  max_price_edits: number
}

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
    /** Thread detail only: the other side's phone (client ↔ agency) while the agent's otklik is live. */
    phone?: string | null
  }
  last_message?: ChatMessage | null
  unread_count: number
  blocked_at?: string | null
  blocked_by?: number | null
  can_write?: boolean
  /** Present on direct thread detail only. */
  active_offer?: ChatActiveOffer | null
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
  /** Agency logo or the user's own photo; null → initials fallback. */
  avatar_url: string | null
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

/** GET /chat/global/unread (and POST /chat/global/read) — drives the home badge. */
export interface GlobalChatUnread {
  count: number
  /** Highest visible message id on the server right now. */
  latest_id: number
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
