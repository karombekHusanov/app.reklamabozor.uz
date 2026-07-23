import { api } from '@/core/api/client'
import type { ApiSuccess } from '@/core/types/api'
import type { Category } from '@/modules/agent/types/agent'

/**
 * Anonymised order shown in the home "live orders" carousel (social proof).
 * The public endpoint intentionally omits client identity, attachments and
 * budget — only the category, a short teaser and activity counters are exposed.
 */
export interface LiveOrder {
  id: number
  title: string
  description: string | null
  category: Category | null
  status: string
  views_count: number
  offers_count: number
  created_at: string
}

/** Most recent real orders (with view / offer counts) for the home carousel. */
export async function fetchLiveOrders(limit = 10): Promise<LiveOrder[]> {
  const { data } = await api.get<ApiSuccess<LiveOrder[]>>('/api/v1/orders/showcase', {
    params: { limit },
  })

  return data.data
}
