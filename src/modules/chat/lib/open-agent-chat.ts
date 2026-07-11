import type { Chat } from '@/modules/chat/types/chat'
import type { OrderStatus } from '@/modules/orders/types/order'
import { fetchChats } from '@/modules/chat/services/chat.service'
import { fetchPublicAgent } from '@/modules/marketplace/services/agents.service'

const ACTIVE_STATUSES: OrderStatus[] = ['in_progress', 'work_submitted']

export type AgentChatResolution =
  | { kind: 'thread'; orderId: number }
  | { kind: 'picker'; chats: Chat[] }
  | { kind: 'empty'; agentName: string }

/** Threads with the given agency (profile id or owning user id). */
export function chatsForAgent(
  chats: Chat[],
  agentProfileId: number,
  agentUserId?: number,
): Chat[] {
  return chats.filter((chat) => {
    if (chat.other_participant.agent_profile_id === agentProfileId) {
      return true
    }

    return agentUserId != null && chat.other_participant.id === agentUserId
  })
}

/** Prefer an active deal, otherwise the most recently updated thread. */
export function pickBestAgentChat(chats: Chat[]): Chat | null {
  if (!chats.length) {
    return null
  }

  const active = chats.filter(chat =>
    chat.order.status != null && ACTIVE_STATUSES.includes(chat.order.status),
  )
  const pool = active.length ? active : chats

  return [...pool].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  )[0] ?? null
}

/**
 * Resolve where to navigate when a client taps "Chat" on an agency profile.
 * Order chats are created when an offer is accepted — there is no pre-deal DM.
 */
export async function resolveAgentChat(agentProfileId: number): Promise<AgentChatResolution> {
  const [agent, chats] = await Promise.all([
    fetchPublicAgent(agentProfileId),
    fetchChats(agentProfileId),
  ])

  const matched = chatsForAgent(chats, agentProfileId, agent.user_id)

  if (matched.length > 1) {
    return { kind: 'picker', chats: matched }
  }

  const best = pickBestAgentChat(matched)
  if (best) {
    return { kind: 'thread', orderId: best.order_id }
  }

  return { kind: 'empty', agentName: agent.company_name }
}
