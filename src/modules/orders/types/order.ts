import type { Category } from '@/modules/agent/types/agent'
import type { OrderRegionRef } from '@/modules/orders/types/region'

export type OrderStatus
  = | 'new'
    | 'offers_sent'
    | 'client_selected'
    // Client picked an offer; waiting for the payment to clear (gateway on).
    | 'awaiting_payment'
    | 'in_progress'
    // Agent delivered the work — waiting for the client to confirm.
    | 'work_submitted'
    | 'completed'
    | 'cancelled'

export type OfferStatus = 'pending' | 'accepted' | 'rejected'

export type PaymentStatus = 'draft' | 'progress' | 'success' | 'error' | 'revert' | 'hold'

export interface Payment {
  id: number
  uuid: string
  purpose: 'order'
  status: PaymentStatus
  amount: number // tiyin
  amount_som: number
  currency: string
  checkout_url: string | null
  card_pan: string | null
  ps: string | null
  paid_at: string | null
  created_at: string
}

/** Response of POST /offers/{id}/accept. */
export interface AcceptOfferResult {
  offer: Offer
  payment: Payment | null
}

/** A single pricelist line on an offer (agent's priced contract). */
export interface OfferItem {
  id: number
  name: string
  unit: string
  quantity: string | number
  unit_price: string | number
  line_total: string | number
  sort_order: number
}

/** Editable pricelist row in the agent builder (no id until saved). */
export interface PricelistItemInput {
  name: string
  unit: string
  quantity: number | string
  unit_price: number | string
}

export type AmendmentStatus = 'pending' | 'approved' | 'applied' | 'rejected' | 'cancelled' | 'expired'

/** Snapshot of a deal's terms before/after an amendment. */
export interface AmendmentSnapshot {
  items: OfferItem[]
  deadline_days: number | null
  total: string
}

/** An "Additional agreement" (Qo'shimcha kelishuv) on an active deal. */
export interface Amendment {
  id: number
  order_id: number
  status: AmendmentStatus
  initiator_role: 'client' | 'agent'
  reason: string | null
  before: AmendmentSnapshot
  after: AmendmentSnapshot
  extra_amount: string | number
  requires_operator: boolean
  requires_formal_doc: boolean
  approvals: { client: boolean, agent: boolean, operator: boolean }
  rejection_reason: string | null
  can_approve: boolean
  can_cancel: boolean
  payment?: { status: string, checkout_url: string | null }
  pdf_url: string | null
  applied_at: string | null
  created_at: string
}

/** Payload for proposing an amendment. */
export interface AmendmentInput {
  items: PricelistItemInput[]
  deadline_days: number
  reason?: string | null
}

export const MAX_PRICELIST_ITEMS = 50

export interface OfferAgent {
  id: number
  profile_id: number | null
  provider_type?: 'agent' | 'designer' | null
  company_name: string | null
  company_logo: string | null
  location_label: string | null
}

export interface Offer {
  id: number
  order_id: number
  /** Null when the response is interest-only (no priced bid yet). */
  price: string | number | null
  comment: string | null
  deadline_days?: number | null
  status: OfferStatus
  /** True when price/comment were never set (otklik). Prefer over price==null when present. */
  is_interest?: boolean
  /** Client may accept only priced pending offers; false for interest. */
  can_accept?: boolean
  /** Pricelist lines (present once the agent sent a priced contract). */
  items?: OfferItem[]
  price_updated_at?: string | null
  chat_id?: number | null
  agent: OfferAgent
  created_at: string
  updated_at: string
}

/** Per-order service contract (generated once the deal starts). */
export interface OrderContract {
  id: number
  number: string
  total: string | number
  pdf_url: string | null
  version: string
  generated_at: string | null
}

export type OrderDeadline = 'today_tomorrow' | 'this_week'

export type ReviewDirection = 'client_to_provider' | 'provider_to_client'
export type ReviewStatus = 'pending' | 'approved' | 'rejected'

export interface ReviewCriterionScore {
  code: string
  score: number
  label?: string
  weight?: number
}

export interface OrderReview {
  id: number
  order_id: number
  direction: ReviewDirection
  /** Weighted average across criteria (1.00–5.00). */
  rating: number
  criteria: ReviewCriterionScore[]
  comment: string | null
  status: ReviewStatus
  reviewer_name?: string | null
  reviewer_avatar?: string | null
  created_at: string
}

export interface ReviewCriterionDef {
  code: string
  label: string
  weight: number
}

export interface RatingInfo {
  stars: number
  stars_count: number
  grade: number
}

/** Raw row from GET /me/rating (collection item). */
export interface UserRatingRow {
  user_id: number
  role: string
  agent_profile_id: number | null
  stars: number
  stars_count: number
  grade: number
  listing_boost?: number
  rating_avg?: number | null
  rating_count?: number
}

export interface OrderAttachment {
  id: number
  url: string
  original_name: string
  mime_type: string | null
  size: number
  created_at: string
}

/** Shared catalog tag attached to an order (max 5). */
export interface OrderHashtag {
  id: number
  slug: string
  label: string
}

export const MAX_ORDER_HASHTAGS = 5

export interface Order {
  id: number
  title: string
  description: string
  deadline: OrderDeadline | null
  category: Category | null
  hashtags?: OrderHashtag[]
  attachment_file_ids: number[]
  attachment_files: OrderAttachment[]
  budget_min: string | null
  budget_max: string | null
  lat?: string | number | null
  lng?: string | number | null
  location_label?: string | null
  /** Optional catalog region (null = all Uzbekistan). */
  region?: OrderRegionRef | null
  /** Optional district (Tashkent city only). */
  district?: OrderRegionRef | null
  status: OrderStatus
  /** Set when the order was sent directly to one agency (null for a broadcast order). */
  target_agent?: { id: number, company_name: string | null } | null
  work_submitted_at: string | null
  completed_at: string | null
  auto_completed: boolean
  /** The client's review of the winning agency (absent until submitted). */
  review?: OrderReview | null
  /** The provider's review of the client (absent until submitted). */
  provider_review?: OrderReview | null
  /** Per-order service contract (present once the deal started). */
  contract?: OrderContract | null
  /** Latest payment for the order (checkout_url / status). Null when gateway off. */
  payment?: Payment | null
  offers?: Offer[]
  offers_count?: number
  views_count?: number
  created_at: string
  updated_at: string
}

/** Preset budget bands (canonical values; labels resolved via i18n). */
export type OrderBudget = 'lt_1m' | 'from_1_3m' | 'from_3_5m' | 'from_5_10m' | 'gt_10m'

/** Payload for POST /api/v1/orders. */
export interface CreateOrderPayload {
  category_id: number
  description: string
  attachment_file_ids: number[]
  /** Client location (map pin). */
  lat: number
  lng: number
  location_label?: string | null
  /** Optional catalog region; omit/null = all Uzbekistan. */
  region_id?: number | null
  /** Optional district (only valid for Tashkent city). */
  district_id?: number | null
  deadline?: OrderDeadline | null
  /** Direct the order to a single agency (its public profile id). Omit for a broadcast order. */
  agent_profile_id?: number
  /** Project name, e.g. "Coffee House banner". */
  title?: string
  /** Free-text hashtags (normalized server-side), max 5. */
  hashtags?: string[]
  /** Concrete deadline as an ISO date string, e.g. "2026-07-15". */
  deadline_date?: string | null
  /** Preset budget band. UI-only for now — backend drops until wired. */
  budget?: OrderBudget | null
  /** Show TZ/files on Recent / Live Orders. Default true if omitted. */
  show_files_in_showcase?: boolean
}

/** A file the client has uploaded into the order draft. */
export interface DraftFile {
  id: number
  url: string
  name: string
  mime: string | null
  size: number
}

/** Working state for the multi-step order wizard. */
export interface OrderDraft {
  category_id: number | null
  title: string
  description: string
  /** Free-text hashtag labels (max 5). */
  hashtags: string[]
  /** Concrete deadline as an ISO date string, e.g. "2026-07-15". */
  deadline_date: string | null
  budget: OrderBudget | null
  /** Optional catalog region; null = all Uzbekistan. */
  region_id: number | null
  /** Optional district (Tashkent city only). */
  district_id: number | null
  lat: number | null
  lng: number | null
  location_label: string
  files: DraftFile[]
  /** Show uploaded files on the Recent / Live Orders page. */
  show_files_in_showcase: boolean
}

// --- Agent side -------------------------------------------------------------

export interface AgentOrder {
  id: number
  title: string
  description: string
  deadline: OrderDeadline | null
  category: Category | null
  hashtags?: OrderHashtag[]
  attachment_files: OrderAttachment[]
  budget_min: string | null
  budget_max: string | null
  lat?: string | number | null
  lng?: string | number | null
  location_label?: string | null
  region?: OrderRegionRef | null
  district?: OrderRegionRef | null
  status: OrderStatus
  views_count?: number
  offers_count?: number
  client: {
    id?: number | null
    first_name: string | null
    avatar?: string | null
  }
  my_offer: null | {
    id: number
    price: string | number | null
    comment: string | null
    status: OfferStatus
    is_interest?: boolean
    can_accept?: boolean
    items?: OfferItem[]
  }
  created_at: string
}

export interface AgentOffer {
  id: number
  price: string | number | null
  comment: string | null
  status: OfferStatus
  is_interest?: boolean
  can_accept?: boolean
  order: {
    id: number
    title: string | null
    description?: string | null
    status: OrderStatus | null
    category: Category | null
    hashtags?: OrderHashtag[]
    views_count?: number | null
    offers_count?: number | null
    client?: {
      id: number | null
      first_name: string | null
      avatar: string | null
    } | null
    created_at?: string | null
  }
  /** Provider's review of the client on this order (null if not yet reviewed). */
  my_review?: OrderReview | null
  created_at: string
}

/** GET /api/v1/agent/offers/{id} — full order context for the detail page. */
export interface AgentOfferDetail {
  id: number
  price: string | number | null
  comment: string | null
  deadline_days?: number | null
  status: OfferStatus
  is_interest?: boolean
  can_accept?: boolean
  price_updated_at?: string | null
  price_edit_count?: number
  price_edits_remaining?: number
  max_price_edits?: number
  can_edit_price?: boolean
  items?: OfferItem[]
  chat?: { id: number, blocked: boolean } | null
  my_review?: OrderReview | null
  created_at: string
  order: {
    id: number
    title: string | null
    description: string | null
    deadline: OrderDeadline | null
    lat?: string | number | null
    lng?: string | number | null
    location_label?: string | null
    region?: OrderRegionRef | null
    district?: OrderRegionRef | null
    status: OrderStatus | null
    category: Category | null
    attachment_files: OrderAttachment[]
    contract?: OrderContract | null
    views_count?: number | null
    offers_count?: number | null
    client: {
      id: number | null
      first_name: string | null
      avatar: string | null
    } | null
    created_at: string | null
  } | null
}

/** Payload for POST /api/v1/agent/orders/{order}/offers. Empty body = interest (otklik). */
export interface CreateOfferPayload {
  price?: number
  comment?: string
}
