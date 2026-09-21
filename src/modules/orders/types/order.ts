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

export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn'

export type PaymentStatus = 'draft' | 'progress' | 'success' | 'error' | 'revert' | 'hold'

/**
 * How the client pays. Both methods are settled offline and confirmed by a
 * manager (cash at the platform's desk, or a bank transfer).
 */
export type PaymentMethod = 'cash' | 'bank_transfer'

export interface Payment {
  id: number
  uuid: string
  purpose: 'order'
  method: PaymentMethod
  status: PaymentStatus
  amount: number // tiyin
  amount_som: number
  currency: string
  /** Generated invoice (hisob-faktura) for offline payments. */
  invoice_url: string | null
  reference: string | null
  confirmed_at: string | null
  paid_at: string | null
  created_at: string
  /** Share of the outstanding amount this payment covers (offline payments only). */
  percent: number | null
  /** How this payment was reconciled against the ledger (offline payments only). */
  matched_via: 'auto' | 'admin' | null
}

/** Where an active deal stands on money (separate from the work status). */
export type OrderPaymentState = 'not_required' | 'unpaid' | 'paid' | 'refunded'

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

/** One clause block of the addendum document. */
export interface AmendmentSection {
  key: string
  heading: string
  /** `items_after` / `items_before` render a pricelist, `parties` the requisites. */
  type: 'text' | 'items_after' | 'items_before' | 'parties'
  paragraphs: string[]
}

/**
 * The addendum as both parties read it before accepting — same text the PDF
 * carries, with the parent contract named in the preamble.
 */
export interface AmendmentDocument {
  version: string
  number: string
  contract_number: string | null
  contract_date: string | null
  title: string
  subtitle: string
  order_id: number | null
  initiator_role: 'client' | 'agent'
  initiator_label: string
  reason: string | null
  agent: Record<string, string | null>
  client: Record<string, string | boolean | null>
  platform: Record<string, string | number | null>
  before: AmendmentSnapshot
  after: AmendmentSnapshot
  delta: string
  delta_direction: 'charge' | 'refund' | 'none'
  deadline_changed: boolean
  requires_operator: boolean
  sections: AmendmentSection[]
  generated_at: string
  hash: string
}

/** An "Additional agreement" (Qo'shimcha kelishuv) on an active deal. */
export interface Amendment {
  id: number
  order_id: number
  /** Addendum number, e.g. RB-35-2026/DS1 (null on legacy rows). */
  number: string | null
  contract_number: string | null
  document_hash: string | null
  expires_at: string | null
  refund: {
    state: 'none' | 'due' | 'refunded' | 'waived'
    amount: string
    method: string | null
    reference: string | null
    note: string | null
    refunded_at: string | null
  }
  acceptances: { client: string | null, agent: string | null, operator: string | null }
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
  payment?: { status: string }
  pdf_url: string | null
  applied_at: string | null
  created_at: string
}

/** Payload for proposing an amendment (click-wrap confirmation included). */
export interface AmendmentInput {
  items: PricelistItemInput[]
  deadline_days: number
  reason?: string | null
}

/** Who may propose an amendment right now, and until when. */
export interface AmendmentWindow {
  can_propose: boolean
  reason: 'ok' | 'not_active' | 'not_participant' | 'pending_exists' | 'window_closed'
  ends_at: string | null
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
  /** Click-wrap consent on the per-order contract (ISO timestamps or null). */
  contract?: OfferContractState | null
  chat_id?: number | null
  agent: OfferAgent
  created_at: string
  updated_at: string
}

/** Which parties have accepted the per-order contract for an offer. */
export interface OfferContractState {
  agent_accepted_at: string | null
  client_accepted_at: string | null
}

/** One clause block of the contract shown in the accept drawer. */
export interface ContractSection {
  key: string
  heading: string
  /** `items` renders the pricelist table, `parties` the requisites block. */
  type: 'text' | 'items' | 'parties'
  paragraphs: string[]
}

/**
 * The three-party contract (client ↔ agent ↔ platform as operator) exactly as
 * the accepting party sees it. `hash` is sent back on accept so a document the
 * agent has revised meanwhile cannot be accepted by mistake.
 */
export interface ContractDocument {
  version: string
  terms_version: string
  number: string
  title: string
  subtitle: string
  order_id: number | null
  offer_id: number
  agent: Record<string, string | null>
  client: Record<string, string | boolean | null>
  platform: Record<string, string | number | null>
  items: ContractLine[]
  total: string
  deadline_days: number | null
  deadline_label: string | null
  intro: string
  sections: ContractSection[]
  generated_at: string
  hash: string
}

export interface ContractLine {
  name: string
  unit: string
  quantity: string
  unit_price: string
  line_total: string
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

/** Accounting act generated when the order completed. */
export interface OrderDocument {
  id: number
  type: 'work_act' | 'commission_act'
  title: string
  number: string
  total: string | number
  pdf_url: string | null
  hash: string | null
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

/** Order route, fixed at creation: Tender (priced offers + contract) or Tezkor (one-agent claim). */
export type OrderRoute = 'tender' | 'tezkor'

/** The agent holding an exclusive Tezkor claim on an order. */
export interface OrderClaim {
  agent_id: number
  claimed_at: string
  agent: {
    first_name: string | null
    last_name: string | null
    phone: string | null
    username: string | null
    profile_id: number | null
    company_name: string | null
    company_logo: string | null
    location_label: string | null
    stars: number | null
    stars_count: number | null
    grade: number | null
  }
}

export interface Order {
  id: number
  route?: OrderRoute
  /** Tezkor: client may reject the claimed agent and reopen the request. */
  can_release?: boolean
  /** Tezkor: client may close the request as agreed. */
  can_close?: boolean
  claim?: OrderClaim | null
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
  documents?: OrderDocument[]
  /** Latest payment attempt (checkout / invoice / offline). Null when gateway off. */
  payment?: Payment | null
  /** Money track: the deal runs from contract acceptance, payment may be owed. */
  payment_state?: OrderPaymentState | null
  payment_due_at?: string | null
  paid_at?: string | null
  /** Who may propose an additional agreement, and until when (client window). */
  amendment_window?: AmendmentWindow | null
  outstanding_som?: number
  activated_at?: string | null
  /** Whether the client may still cancel (unpaid: always; paid: within window). */
  can_cancel?: boolean
  /** End of the cooling-off window on a paid deal. */
  cancel_deadline_at?: string | null
  /** Escalation state once the client flags a stalled deal or a rejected delivery to ops. */
  problem_state?: 'none' | 'flagged' | 'resolved' | null
  /** Deadline given to the provider to fix things once a problem is open (set while flagged). */
  correction_deadline_at?: string | null
  /** Whether the client may report that the winning agency hasn't started the paid work. */
  can_report_no_start?: boolean
  /** When the no-start report unlocks, if `can_report_no_start` is still false. */
  no_start_report_eligible_at?: string | null
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
  /** Optional: omitted = broadcast, every approved provider sees the order. */
  category_id?: number
  description: string
  attachment_file_ids: number[]
  /** Optional map pin — send both coordinates or neither. */
  lat?: number
  lng?: number
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
  /** Route is fixed at creation; tender needs `can_create_tender` (403 otherwise). */
  route: OrderRoute
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
  route?: OrderRoute
  /** Tezkor: another (or this) agent already holds the claim. */
  claimed?: boolean
  claimed_by_me?: boolean
  can_offer?: boolean
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
    /** Shown to the claiming agent on a Tezkor request. */
    phone?: string | null
    username?: string | null
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
  can_withdraw?: boolean
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
  can_withdraw?: boolean
  price_updated_at?: string | null
  price_edit_count?: number
  price_edits_remaining?: number
  max_price_edits?: number
  can_edit_price?: boolean
  contract?: OfferContractState | null
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
  documents?: OrderDocument[]
    amendment_window?: AmendmentWindow | null
    outstanding_som?: number
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
