import type { OfferStatus, OrderStatus } from '@/modules/orders/types/order'

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning'

const ORDER_LABELS: Record<OrderStatus, string> = {
  new: 'New',
  offers_sent: 'Offers received',
  client_selected: 'Agency selected',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const ORDER_VARIANTS: Record<OrderStatus, BadgeVariant> = {
  new: 'primary',
  offers_sent: 'primary',
  client_selected: 'warning',
  in_progress: 'success',
  completed: 'success',
  cancelled: 'default',
}

const OFFER_LABELS: Record<OfferStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Not selected',
}

const OFFER_VARIANTS: Record<OfferStatus, BadgeVariant> = {
  pending: 'default',
  accepted: 'success',
  rejected: 'default',
}

export function orderStatusLabel(status: OrderStatus): string {
  return ORDER_LABELS[status] ?? status
}

export function orderStatusVariant(status: OrderStatus): BadgeVariant {
  return ORDER_VARIANTS[status] ?? 'default'
}

export function offerStatusLabel(status: OfferStatus): string {
  return OFFER_LABELS[status] ?? status
}

export function offerStatusVariant(status: OfferStatus): BadgeVariant {
  return OFFER_VARIANTS[status] ?? 'default'
}

/** Locale-aware price formatting in UZS. */
export function formatPrice(value: string | number): string {
  const n = typeof value === 'string' ? Number(value) : value
  if (Number.isNaN(n)) return String(value)
  return new Intl.NumberFormat('uz-UZ').format(n) + ' so‘m'
}
