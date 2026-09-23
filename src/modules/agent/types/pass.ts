export type PassMode = 'daily_pass' | 'per_response'

export interface AgentPass {
  active: boolean
  expires_at: string | null
  seconds_left: number
  price_som: number
  hours: number
  mode: PassMode
  enforce: boolean
  wallet_enabled: boolean
  response_price_som: number
  max_active_claims: number
  balance_som: number | null
}

export interface PassPurchaseResult {
  activated: boolean
  checkout_url: string | null
  payment_ref: string | null
  pass: AgentPass | null
}

export interface CardPaymentStart {
  payment_ref: string
  amount_som: number
  /** "8600 •••• 2365" */
  card_mask: string | null
}

export interface PassHistoryItem {
  id: number
  starts_at: string
  expires_at: string
  price_som: number
  source: string
  status: string
  is_current: boolean
  note: string | null
}

export type ClaimBlockCode
  = 'pass_required'
    | 'claim_limit_reached'
    | 'insufficient_balance'
    | 'payment_source_unavailable'
