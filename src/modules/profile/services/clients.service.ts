import { api } from '@/core/api/client'
import type { ApiSuccess } from '@/core/types/api'

export interface PublicClient {
  id: number
  first_name: string
  last_name: string | null
  avatar: string | null
  is_verified: boolean
  created_at: string
  total_orders: number
  in_progress_orders: number
  completed_orders: number
  cancelled_orders: number
  rating_avg: number | null
  rating_count: number
}

export async function fetchPublicClient(id: number): Promise<PublicClient> {
  const { data } = await api.get<ApiSuccess<PublicClient>>(`/api/v1/clients/${id}`)

  return data.data
}
