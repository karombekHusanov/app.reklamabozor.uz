import { api } from '@/core/api/client'
import type { ApiSuccess } from '@/core/types/api'
import type { Category } from '@/modules/agent/types/agent'
import type { OfferStatus, OrderAttachment } from '@/modules/orders/types/order'

export interface ShowcaseClient {
  id: number
  first_name: string | null
  avatar: string | null
}

export interface LiveOrder {
  id: number
  title: string
  description: string | null
  category: Category | null
  status: string
  views_count: number
  offers_count: number
  client?: ShowcaseClient | null
  created_at: string
}

export interface ShowcaseOrder {
  id: number
  title: string
  description: string | null
  deadline: string | null
  category: Category | null
  attachment_files: OrderAttachment[]
  status: string
  views_count: number
  offers_count: number
  client: ShowcaseClient | null
  my_offer: null | {
    id: number
    price: string | number
    comment: string
    status: OfferStatus
  }
  can_offer: boolean
  created_at: string
}

/** Most recent real orders (with view / offer counts) for the home carousel. */
export async function fetchLiveOrders(limit = 10): Promise<LiveOrder[]> {
  const { data } = await api.get<ApiSuccess<LiveOrder[]>>('/api/v1/orders/showcase', {
    params: { limit },
  })

  return data.data
}

/** Full detail of a single showcase order (auth required). */
export async function fetchShowcaseOrder(id: number): Promise<ShowcaseOrder> {
  const { data } = await api.get<ApiSuccess<ShowcaseOrder>>(`/api/v1/orders/showcase/${id}`)

  return data.data
}
