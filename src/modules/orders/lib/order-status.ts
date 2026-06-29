import type { OfferStatus, OrderStatus } from '@/modules/orders/types/order'

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning'

// Status text labels live in the i18n messages (`orders.status` / `orders.offerStatus`);
// this module owns only the visual variant mapping and price formatting.

const ORDER_VARIANTS: Record<OrderStatus, BadgeVariant> = {
  new: 'primary',
  offers_sent: 'primary',
  client_selected: 'warning',
  in_progress: 'success',
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

/** Locale-aware price formatting in UZS. */
export function formatPrice(value: string | number): string {
  const n = typeof value === 'string' ? Number(value) : value
  if (Number.isNaN(n)) return String(value)
  return new Intl.NumberFormat('uz-UZ').format(n) + ' so‘m'
}
