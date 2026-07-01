import type { Category } from '@/modules/agent/types/agent'

export type OrderStatus
  = | 'new'
    | 'offers_sent'
    | 'client_selected'
    | 'in_progress'
    | 'completed'
    | 'cancelled'

export type OfferStatus = 'pending' | 'accepted' | 'rejected'

export interface OfferAgent {
  id: number
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

export interface Order {
  id: number
  title: string
  description: string
  deadline: OrderDeadline | null
  category: Category | null
  tz_file_id: number | null
  tz_file: string | null
  attachment_file_ids: number[]
  budget_min: string | null
  budget_max: string | null
  status: OrderStatus
  offers?: Offer[]
  offers_count?: number
  views_count?: number
  created_at: string
  updated_at: string
}

/** Payload for POST /api/v1/orders. */
export interface CreateOrderPayload {
  category_id: number
  description: string
  tz_file_id: number
  deadline?: OrderDeadline | null
  /** Extra reference files (slots 2-4). */
  attachment_file_ids?: number[]
}

// --- Agent side -------------------------------------------------------------

export interface AgentOrder {
  id: number
  title: string
  description: string
  deadline: OrderDeadline | null
  category: Category | null
  tz_file: string | null
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
