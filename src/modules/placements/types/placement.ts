import type { OrderRegionRef } from '@/modules/orders/types/region'

export type PlacementKind = 'led_screen' | 'billboard' | 'citylight' | 'other'
export type PlacementStatus = 'unclaimed' | 'active' | 'hidden' | 'not_for_sale'

/** Map-list shape of a placement (GET /api/v1/placements). */
export interface Placement {
  id: number
  kind: PlacementKind
  status: PlacementStatus
  address: string
  lat: string | number
  lng: string | number
  /** Screens on the same pole / two faces share a key (stack them on the map). */
  group_key: string | null
  district: OrderRegionRef | null
  owner: {
    name: string
    /** Owner is an approved agency on PRB — orders go straight to them. */
    on_platform: boolean
    agent_profile_id: number | null
    /** Public contacts as imported — the client calls the owner directly. */
    phones: string[]
    website: string | null
    email: string | null
  }
  has_price: boolean
  min_day_price_tiyin: number | null
  min_day_price_som: number | null
  audience_tags: string[]
  photo: string | null
  /** Category a map order is filed under ("Tashqi reklama › LED ekran"). */
  category_id: number | null
}

export interface PlacementRate {
  id: number
  unit: 'day' | 'week' | 'month'
  slot_seconds: number
  shows_per_hour: number
  price_tiyin: number
  price_som: number
  min_quantity: number
}

/** Detail shape (GET /api/v1/placements/{id}). */
export interface PlacementDetail extends Placement {
  external_ref: string | null
  specs: Record<string, unknown>
  slot_seconds: number | null
  shows_per_hour: number | null
  photos: string[]
  rates: PlacementRate[]
  verified_at: string | null
}

/** A screen attached to an order (snapshot + live coordinates). */
export interface OrderPlacement {
  id: number
  placement_id: number
  address: string
  owner_name: string
  kind: PlacementKind | null
  lat: string | number | null
  lng: string | number | null
  unit: string | null
  quantity: number | null
  slot_seconds: number | null
  shows_per_hour: number | null
  date_from: string | null
  date_to: string | null
  estimated_price_som: number | null
  sort_order: number
}

export interface PlacementListParams {
  /** "south,west,north,east" */
  bbox?: string
  region_id?: number
  with_price?: boolean
  q?: string
  limit?: number
}
