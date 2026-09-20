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

/** Where the agent's earnings are headed, and how they get there. */
export interface PayoutDestination {
  channel: 'bank'
  bank: {
    bank_name: string | null
    bank_account: string | null
    mfo: string | null
    complete: boolean
  }
}

export interface EarningsResponse {
  payout: PayoutDestination
  balance: EarningsBalance
  items: Payout[]
  meta: { current_page: number, last_page: number, per_page: number, total: number }
}
