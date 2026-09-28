import { api } from '@/core/api/client'
import type { ApiSuccess } from '@/core/types/api'
import type { Category } from '@/modules/agent/types/agent'
import type { OfferStatus, OrderAttachment, OrderHashtag, OrderRoute } from '@/modules/orders/types/order'
import type { OrderRegionRef } from '@/modules/orders/types/region'

export interface ShowcaseClient {
  id: number
  first_name: string | null
  avatar: string | null
}

export interface LiveOrder {
  id: number
  route?: OrderRoute
  can_offer?: boolean
  title: string
  description: string | null
  category: Category | null
  region?: OrderRegionRef | null
  district?: OrderRegionRef | null
  hashtags?: OrderHashtag[]
  status: string
  views_count: number
  offers_count: number
  client?: ShowcaseClient | null
  created_at: string
}

export interface ShowcaseOrder {
  id: number
  route?: OrderRoute
  title: string
  description: string | null
  deadline: string | null
  category: Category | null
  region?: OrderRegionRef | null
  district?: OrderRegionRef | null
  hashtags?: OrderHashtag[]
  attachment_files: OrderAttachment[]
  status: string
  views_count: number
  offers_count: number
  client: ShowcaseClient | null
  my_offer: null | {
    id: number
    price: string | number | null
    comment: string | null
    status: OfferStatus
    is_interest?: boolean
    can_accept?: boolean
  }
  can_offer: boolean
  created_at: string
}

export interface HashtagSuggest {
  id: number
  slug: string
  label: string
  usage_count: number
}

export interface LiveOrdersFilters {
  route?: OrderRoute | null
  q?: string | null
  hashtag?: string | null
  category_ids?: number[] | null
  region_id?: number | null
  district_id?: number | null
  created_from?: string | null
  created_to?: string | null
}

/** Most recent real orders (with view / offer counts) for the home carousel / list. */
export async function fetchLiveOrders(
  limit = 10,
  filters: LiveOrdersFilters = {},
): Promise<LiveOrder[]> {
  const { data } = await api.get<ApiSuccess<LiveOrder[]>>('/api/v1/orders/showcase', {
    params: {
      limit,
      ...(filters.route ? { route: filters.route } : {}),
      ...(filters.q?.trim() ? { q: filters.q.trim() } : {}),
      ...(filters.hashtag ? { hashtag: filters.hashtag } : {}),
      ...(filters.category_ids?.length ? { category_ids: filters.category_ids.join(',') } : {}),
      ...(filters.region_id != null ? { region_id: filters.region_id } : {}),
      ...(filters.district_id != null ? { district_id: filters.district_id } : {}),
      ...(filters.created_from ? { created_from: filters.created_from } : {}),
      ...(filters.created_to ? { created_to: filters.created_to } : {}),
    },
  })

  return data.data
}

/** Active hashtag catalog for filters / autocomplete. */
export async function fetchHashtagSuggest(q = '', limit = 15): Promise<HashtagSuggest[]> {
  const { data } = await api.get<ApiSuccess<HashtagSuggest[]>>('/api/v1/hashtags', {
    params: { q: q || undefined, limit },
  })

  return data.data
}

/** Full detail of a single showcase order (auth required). */
export async function fetchShowcaseOrder(id: number): Promise<ShowcaseOrder> {
  const { data } = await api.get<ApiSuccess<ShowcaseOrder>>(`/api/v1/orders/showcase/${id}`)

  return data.data
}
