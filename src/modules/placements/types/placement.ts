import type { OrderRegionRef } from '@/modules/orders/types/region'

export type PlacementKind = 'led_screen' | 'billboard' | 'citylight' | 'other'
export type PlacementStatus = 'unclaimed' | 'active' | 'hidden' | 'not_for_sale'

/** Map-list shape of a placement (GET /api/v1/placements). */
export interface Placement {
  id: number
  kind: PlacementKind
  status: PlacementStatus
  /** Owner's own name for the screen ("Magic city") and its size in metres ("16×6"). */
  name: string | null
  size: string | null
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
  /** Headline price — owners quote by the month (cheapest clip length). */
  min_month_price_som: number | null
  /** Clip lengths (seconds) on the rate card — the calculator's choices. */
  slot_options: number[]
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

/** One screen in a calculator result (POST /api/v1/placements/estimate). */
export interface PlacementEstimateItem {
  placement_id: number
  name: string | null
  size: string | null
  address: string
  owner_name: string
  slot_options: number[]
  /** False when the owner does not sell the chosen clip length. */
  priced: boolean
  rate: { unit: 'day' | 'week' | 'month', slot_seconds: number, price_som: number } | null
  day_price_som: number | null
  price_som: number | null
}

export interface PlacementEstimate {
  days: number
  slot_seconds: number
  month_days: number
  /** Shortest booking the calculator quotes (owners sell by the month). */
  min_days: number
  items: PlacementEstimateItem[]
  format_items: FormatEstimateItem[]
  priced_count: number
  unpriced_count: number
  subtotal_som: number
  vat_percent: number
  vat_som: number
  total_som: number
}

export type MetroLine = 'chilonzor' | 'ozbekiston' | 'yunusobod' | 'halqa'

/** A per-unit format sold across the metro (GET /api/v1/ad-formats). */
export interface AdFormat {
  id: number
  code: string
  venue: string
  medium: 'digital' | 'static'
  name_uz: string
  name_ru: string
  specs: { size?: string, resolution?: string, material?: string, hours?: string, note?: string }
  total_count: number
  line_counts: Partial<Record<MetroLine, number>>
  /** Sold only as the whole network set — no quantity to choose. */
  is_package: boolean
  min_months: number
  /** False for static formats: printing + mounting are billed separately. */
  production_included: boolean
  daily_reach: number | null
  slot_options: number[]
  rates: { slot_seconds: number, price_som: number }[]
  min_month_price_som: number | null
  owner: { name: string, phones: string[], website: string | null }
}

/** A format picked for the calculator. */
export interface SelectedFormat {
  format: AdFormat
  quantity: number
}

/** One metro format in a calculator result. */
export interface FormatEstimateItem {
  format_id: number
  code: string
  medium: 'digital' | 'static'
  name_uz: string
  name_ru: string
  owner_name: string
  is_package: boolean
  quantity: number
  total_count: number
  slot_options: number[]
  priced: boolean
  month_price_som: number | null
  billed_days: number
  /** The term was stretched to the format's minimum / a whole month. */
  term_adjusted: boolean
  production_included: boolean
  price_som: number | null
}

export interface MetroStation {
  name_uz: string
  name_ru: string
  lat: number
  lng: number
}

/** One metro line with its stations in travel order (GET /api/v1/metro/lines). */
export interface MetroLineData {
  code: MetroLine
  name_uz: string
  name_ru: string
  stations: MetroStation[]
}
