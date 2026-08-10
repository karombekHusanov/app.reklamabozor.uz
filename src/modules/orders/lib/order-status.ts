import type { OfferStatus, OrderStatus } from '@/modules/orders/types/order'

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning'

// Status text labels live in the i18n messages (`orders.status` / `orders.offerStatus`);
// this module owns only the visual variant mapping and price formatting.

const ORDER_VARIANTS: Record<OrderStatus, BadgeVariant> = {
  new: 'primary',
  offers_sent: 'primary',
  client_selected: 'warning',
  awaiting_payment: 'warning',
  in_progress: 'success',
  work_submitted: 'warning',
  completed: 'success',
  cancelled: 'default',
}

const OFFER_VARIANTS: Record<OfferStatus, BadgeVariant> = {
  pending: 'default',
  accepted: 'success',
  rejected: 'default',
}

export function orderStatusVariant(status: OrderStatus): BadgeVariant {
  return ORDER_VARIANTS[status] ?? 'default'
}

export function offerStatusVariant(status: OfferStatus): BadgeVariant {
  return OFFER_VARIANTS[status] ?? 'default'
}

/** Locale-aware price formatting in UZS. Null/empty → empty string (callers show Interest badge). */
export function formatPrice(value: string | number | null | undefined): string {
  if (value == null || value === '') return ''
  const n = typeof value === 'string' ? Number(value) : value
  if (Number.isNaN(n)) return String(value)
  return new Intl.NumberFormat('uz-UZ').format(n) + ' so‘m'
}

type InterestLike = {
  is_interest?: boolean
  price?: string | number | null
  status?: string
  can_accept?: boolean
}

/** Interest (otklik) when flagged, or when price was never set. */
export function isInterestOffer(offer: InterestLike): boolean {
  return offer.is_interest ?? (offer.price == null || offer.price === '')
}

/** Accept only when backend allows it; fallback: priced + pending. */
export function canAcceptOffer(offer: InterestLike): boolean {
  if (offer.can_accept != null) return offer.can_accept
  return offer.price != null && offer.price !== '' && offer.status === 'pending'
}
