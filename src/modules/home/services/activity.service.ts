import { api } from '@/core/api/client'
import type { ApiSuccess } from '@/core/types/api'

export interface LiveOrdersActivity {
  count: number
  last_seen_at: string | null
}

export interface ChatsActivity {
  unread_messages: number
  unread_threads: number
  order_unread_messages: number
  direct_unread_messages: number
  global_unread: number
}

export interface ClientActivity {
  orders_total: number
  orders_open: number
  orders_awaiting_payment: number
  orders_in_progress: number
  orders_awaiting_confirmation: number
  orders_completed: number
  orders_cancelled: number
  offers_received_pending: number
  reviews_pending: number
}

export interface ProviderActivity {
  has_profile: boolean
  profile_status: string | null
  offers_total: number
  offers_pending: number
  offers_accepted: number
  offers_rejected: number
  deals_awaiting_payment: number
  deals_in_progress: number
  deals_work_submitted: number
  deals_completed: number
  reviews_pending: number
  portfolio_items: number
  categories: number
}

export interface UserActivity {
  role: string
  roles: string[]
  agent_profile_id: number | null
  chats: ChatsActivity
  client: ClientActivity | null
  provider: ProviderActivity | null
  live_orders: LiveOrdersActivity
  notifications: { unread: number }
  action_required: number
  generated_at: string
}

/** Aggregated badge counters for the signed-in user. */
export async function fetchMyActivity(params?: {
  role?: string
  agent_profile_id?: number
}): Promise<UserActivity> {
  const { data } = await api.get<ApiSuccess<UserActivity>>('/api/v1/me/activity', {
    params,
  })

  return data.data
}

/** Clear the Live Orders "new" badge (server last-seen cursor). */
export async function markLiveOrdersSeen(): Promise<LiveOrdersActivity> {
  const { data } = await api.post<ApiSuccess<LiveOrdersActivity>>(
    '/api/v1/me/activity/live-orders/seen',
  )

  return data.data
}
