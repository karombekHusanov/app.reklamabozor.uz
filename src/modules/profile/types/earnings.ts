export type PayoutTranche = 'advance' | 'final' | 'adjustment'
export type PayoutStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled'

export interface Payout {
  id: number
  order_id: number
  order_title: string | null
  tranche: PayoutTranche
  status: PayoutStatus
  method: string | null
  amount: number // tiyin
  amount_som: number
  currency: string
  paid_at: string | null
  created_at: string
}

export interface EarningsBalance {
  available: number
  available_som: number
  processing: number
  processing_som: number
  paid: number
  paid_som: number
  total: number
  total_som: number
  currency: string
}

export interface EarningsResponse {
  balance: EarningsBalance
  items: Payout[]
  meta: { current_page: number, last_page: number, per_page: number, total: number }
}

export type WithdrawalStatus =
  | 'draft'
  | 'card_pending'
  | 'otp_required'
  | 'success'
  | 'failed'
  | 'cancelled'

export interface Withdrawal {
  id: number
  method: string
  status: WithdrawalStatus
  amount: number
  amount_som: number
  currency: string
  form_url: string | null
  card_pan: string | null
  ps: string | null
  failure_reason: string | null
  paid_at: string | null
  created_at: string
}
