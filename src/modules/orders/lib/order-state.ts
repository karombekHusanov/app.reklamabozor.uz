import type { Order, OrderStatus, PaymentStatus } from '@/modules/orders/types/order'

/** Where the order sits on the four-beat rail shown at the top of the detail page. */
export const ORDER_STEPS = 4

const STEP_BY_STATUS: Record<OrderStatus, number> = {
  new: 1,
  offers_sent: 1,
  client_selected: 2,
  awaiting_payment: 2,
  in_progress: 3,
  work_submitted: 3,
  completed: 4,
  cancelled: 0,
}

export function orderStep(status: OrderStatus): number {
  return STEP_BY_STATUS[status] ?? 0
}

export type StateTone = 'info' | 'success' | 'warning' | 'danger' | 'muted'

const ORDER_TONES: Record<OrderStatus, StateTone> = {
  new: 'info',
  offers_sent: 'info',
  client_selected: 'warning',
  awaiting_payment: 'warning',
  in_progress: 'success',
  work_submitted: 'warning',
  completed: 'success',
  cancelled: 'muted',
}

export function orderStatusTone(status: OrderStatus): StateTone {
  return ORDER_TONES[status] ?? 'muted'
}

/**
 * Payment is a second, independent axis: where the money is, not where the
 * work is. `null` = nothing to pay yet (or the gateway is off).
 */
export type PaymentView = 'none' | 'unpaid' | 'pending' | 'paid' | 'failed' | 'reverted'

const PAYMENT_VIEWS: Record<PaymentStatus, PaymentView> = {
  draft: 'unpaid',
  progress: 'pending',
  hold: 'pending',
  success: 'paid',
  error: 'failed',
  revert: 'reverted',
}

export function paymentView(order: Pick<Order, 'payment' | 'status' | 'payment_state'>): PaymentView {
  // The order's own money track wins: a deal can be active and still unpaid.
  if (order.payment_state === 'paid') return 'paid'
  if (order.payment_state === 'refunded') return 'reverted'

  if (order.payment_state === 'unpaid') {
    // An offline invoice (cash / bank) sits pending until a manager confirms it.
    return order.payment && order.payment.method !== 'multicard'
      && ['draft', 'progress'].includes(order.payment.status)
      ? 'pending'
      : 'unpaid'
  }

  if (!order.payment) {
    return order.status === 'awaiting_payment' ? 'unpaid' : 'none'
  }

  return PAYMENT_VIEWS[order.payment.status] ?? 'none'
}

const PAYMENT_TONES: Record<PaymentView, StateTone> = {
  none: 'muted',
  unpaid: 'danger',
  pending: 'warning',
  paid: 'success',
  failed: 'danger',
  reverted: 'muted',
}

export function paymentTone(view: PaymentView): StateTone {
  return PAYMENT_TONES[view]
}
