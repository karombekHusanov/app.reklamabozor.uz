import { categoryName } from '@/core/i18n/category-name'
import type { Locale } from '@/core/i18n/messages'
import { ROUTES } from '@/modules/shell/constants/routes'
import type { Chat } from '@/modules/chat/types/chat'

/** Inbox row helpers shared by the client inbox and the agent Chats tab. */

export function chatTitle(chat: Chat): string {
  return chat.other_participant.company_name || chat.other_participant.name
}

/** "#12 · Banner" for order threads, the direct-chat label otherwise. */
export function chatOrderLabel(chat: Chat, labels: { orderChip: string, directLabel: string }, locale: Locale): string {
  if (chat.order_id == null) return labels.directLabel
  const title = chat.order?.title || (chat.order?.category ? categoryName(chat.order.category, locale) : '')
  return labels.orderChip.replace('{id}', String(chat.order_id)).replace('{title}', title)
}

export function chatRoute(chat: Chat): string | null {
  if (chat.type === 'direct') return ROUTES.chatDirect(chat.id)
  return chat.order_id ? ROUTES.chatOrder(chat.order_id) : null
}
