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
  /** false for a saved card — it is charged at once, the result is in status/summary. */
  requires_otp: boolean
  status?: 'pending' | 'success' | 'failed'
  summary?: AgentPass
}

/** A card bound at the provider — only the masked number reaches the client. */
export interface SavedCard {
  id: number
  card_mask: string
  last_used_at: string | null
}

/** What to charge: a saved card, or a typed card (optionally saved). */
export type CardInput =
  | { card_id: number }
  | { card_number: string, expiry: string, save_card: boolean }

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

export type WalletTransactionType = 'topup' | 'pass' | 'response_fee' | 'adjustment'

export interface WalletTransaction {
  id: number
  type: WalletTransactionType
  /** Signed: credits positive, debits negative. */
  amount_som: number
  note: string | null
  created_at: string | null
}

/** GET /agent/wallet */
export interface AgentWallet {
  enabled: boolean
  balance_som: number
  transactions: WalletTransaction[]
}
