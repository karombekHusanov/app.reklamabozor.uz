import type { Category } from '@/modules/agent/types/agent'

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

export interface OfferAgent {
  id: number
  profile_id: number | null
  company_name: string | null
  company_logo: string | null
  location_label: string | null
}

export interface Offer {
  id: number
  order_id: number
  price: string | number
  comment: string
  status: OfferStatus
  agent: OfferAgent
  created_at: string
  updated_at: string
}

export type OrderDeadline = 'today_tomorrow' | 'this_week'

export interface OrderReview {
  id: number
  order_id: number
  rating: number
  comment: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export interface OrderAttachment {
  id: number
  url: string
  original_name: string
  mime_type: string | null
  size: number
  created_at: string
}

export interface Order {
  id: number
  title: string
  description: string
  deadline: OrderDeadline | null
  category: Category | null
  attachment_file_ids: number[]
  attachment_files: OrderAttachment[]
  budget_min: string | null
  budget_max: string | null
  status: OrderStatus
  /** Set when the order was sent directly to one agency (null for a broadcast order). */
  target_agent?: { id: number, company_name: string | null } | null
  work_submitted_at: string | null
  completed_at: string | null
  auto_completed: boolean
  /** The client's review of the winning agency (absent until submitted). */
  review?: OrderReview | null
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
  deadline?: OrderDeadline | null
  /** Direct the order to a single agency (its public profile id). Omit for a broadcast order. */
  agent_profile_id?: number
  // --- Brief fields (UI-only for now — the backend drops these until wired). ---
  /** Project name, e.g. "Coffee House banner". */
  title?: string
  /** Concrete deadline as an ISO date string, e.g. "2026-07-15". */
  deadline_date?: string | null
  /** Preset budget band. */
  budget?: OrderBudget | null
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
  /** Concrete deadline as an ISO date string, e.g. "2026-07-15". */
  deadline_date: string | null
  budget: OrderBudget | null
  files: DraftFile[]
}

// --- Agent side -------------------------------------------------------------

export interface AgentOrder {
  id: number
  title: string
  description: string
  deadline: OrderDeadline | null
  category: Category | null
  attachment_files: OrderAttachment[]
  budget_min: string | null
  budget_max: string | null
  status: OrderStatus
  views_count?: number
  offers_count?: number
  client: { first_name: string | null }
  my_offer: null | {
    id: number
    price: string | number
    comment: string
    status: OfferStatus
  }
  created_at: string
}

export interface AgentOffer {
  id: number
  price: string | number
  comment: string
  status: OfferStatus
  order: {
    id: number
    title: string | null
    status: OrderStatus | null
    category: Category | null
  }
  created_at: string
}

/** Payload for POST /api/v1/agent/orders/{order}/offers. */
export interface CreateOfferPayload {
  price: number
  comment: string
}
