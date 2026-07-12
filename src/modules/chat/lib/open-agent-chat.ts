import type { Chat } from '@/modules/chat/types/chat'
import type { OrderStatus } from '@/modules/orders/types/order'
import { openDirectChat, fetchChats } from '@/modules/chat/services/chat.service'
import { fetchPublicAgent } from '@/modules/marketplace/services/agents.service'

const ACTIVE_STATUSES: OrderStatus[] = ['in_progress', 'work_submitted']

export type AgentChatResolution =
  | { kind: 'direct'; chatId: number }
  | { kind: 'order'; orderId: number }
  | { kind: 'picker'; chats: Chat[] }

/** Threads with the given agency (profile id or owning user id). */
export function chatsForAgent(
  chats: Chat[],
  agentProfileId: number,
  agentUserId?: number,
): Chat[] {
  return chats.filter((chat) => {
    if (chat.type === 'direct') {
      return chat.other_participant.agent_profile_id === agentProfileId
        || (agentUserId != null && chat.other_participant.id === agentUserId)
    }

    if (chat.other_participant.agent_profile_id === agentProfileId) {
      return true
    }

    return agentUserId != null && chat.other_participant.id === agentUserId
  })
}

/** Prefer an active order deal, otherwise the most recently updated order thread. */
export function pickBestOrderChat(chats: Chat[]): Chat | null {
  const orderChats = chats.filter(chat => chat.type === 'order')

  if (!orderChats.length) {
    return null
  }

  const active = orderChats.filter(chat =>
    chat.order?.status != null && ACTIVE_STATUSES.includes(chat.order.status),
  )
  const pool = active.length ? active : orderChats

  return [...pool].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  )[0] ?? null
}

/**
 * Resolve where to navigate when a user taps "Chat" on an agency profile.
 * Opens (or returns) a direct in-app conversation — no Telegram redirect.
 */
export async function resolveAgentChat(agentProfileId: number): Promise<AgentChatResolution> {
  const [agent, chats] = await Promise.all([
    fetchPublicAgent(agentProfileId),
    fetchChats(agentProfileId),
  ])

  const matched = chatsForAgent(chats, agentProfileId, agent.user_id)
  const direct = matched.find(chat => chat.type === 'direct')

  if (direct) {
    return { kind: 'direct', chatId: direct.id }
  }

  const orderChats = matched.filter(chat => chat.type === 'order')

  if (orderChats.length > 1) {
    return { kind: 'picker', chats: orderChats }
  }

  const bestOrder = pickBestOrderChat(orderChats)
  if (bestOrder?.order_id) {
    return { kind: 'order', orderId: bestOrder.order_id }
  }

  const opened = await openDirectChat(agentProfileId)

  return { kind: 'direct', chatId: opened.id }
}
