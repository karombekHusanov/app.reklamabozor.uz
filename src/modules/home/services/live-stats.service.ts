import { api } from '@/core/api/client'
import type { ApiSuccess } from '@/core/types/api'

/** Live platform pulse for the home stat cards (`GET /stats/live`). */
export interface LiveStats {
  users_online: number
  agents_online: number
  agencies_total: number
  designers_total: number
  orders_today: number
  active_orders: number
}

export async function fetchLiveStats(): Promise<LiveStats> {
  const { data } = await api.get<ApiSuccess<LiveStats>>('/api/v1/stats/live')

  return data.data
}
