/** When a Tezkor request takes the per-order fee (frozen on each request). */
export type TezkorBilling = 'pay_to_respond' | 'pay_on_pick'

/** GET /agent/pass — the per-order fee and the wallet that pays it. */
export interface AgentPass {
  enforce: boolean
  wallet_enabled: boolean
  /** One price per order (Tender and both Tezkor models). */
  response_price_som: number
  /** Billing new Tezkor requests get; each order carries its own `billing`. */
  tezkor_billing: TezkorBilling
  /** pay_on_pick: minutes the picked agency has to take the job. */
  pick_pay_minutes: number
  balance_som: number | null
}

/** Per-order `billing` on agent-facing order payloads. */
export interface OrderBilling {
  /** null = Tender (always charged on the otklik). */
  mode: TezkorBilling | null
  /** Taken when the otklik is sent (0 = free). */
  otklik_fee_som: number
  /** Taken when the picked agency takes a pay_on_pick job (0 otherwise). */
  take_fee_som: number
}

/** Tezkor pay_on_pick: the client picked this otklik — take it before `expires_at`. */
export interface OfferPick {
  picked_at: string
  expires_at: string
  fee_som: number
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

export type ClaimBlockCode
  = 'insufficient_balance'
    | 'payment_source_unavailable'

export type WalletTransactionType = 'topup' | 'pass' | 'response_fee' | 'take_fee' | 'adjustment' | 'refund'

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
