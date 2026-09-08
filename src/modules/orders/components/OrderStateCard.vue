<script setup lang="ts">
import { computed } from 'vue'
import { AlertCircle, Check, Clock, RotateCcw } from '@lucide/vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { formatDateTime } from '@/core/lib/date'
import { formatPrice } from '@/modules/orders/lib/order-status'
import {
  orderStatusTone,
  orderStep,
  paymentTone,
  paymentView,
  type StateTone,
} from '@/modules/orders/lib/order-state'
import type { Order } from '@/modules/orders/types/order'

const props = defineProps<{ order: Order }>()

const locale = useLocaleStore()

/** Where the work is. */
const statusLabel = computed(() => locale.t.orders.status[props.order.status])
const statusTone = computed(() => orderStatusTone(props.order.status))
const step = computed(() => orderStep(props.order.status))

const hint = computed(() => {
  const t = locale.t.orders
  switch (props.order.status) {
    case 'new': return t.stateHintNew
    case 'offers_sent': return t.stateHintOffers
    case 'client_selected':
    case 'awaiting_payment': return t.stateHintAwaitingPayment
    case 'in_progress': return t.stateHintInProgress
    case 'work_submitted': return t.stateHintWorkSubmitted
    case 'completed': return t.stateHintCompleted
    case 'cancelled': return t.stateHintCancelled
    default: return null
  }
})

const steps = computed(() => [
  locale.t.orders.stepRequest,
  locale.t.orders.stepOffer,
  locale.t.orders.stepProgress,
  locale.t.orders.stepDone,
])

/** Where the money is — deliberately a separate axis from the status above. */
const payment = computed(() => paymentView(props.order))
const paymentToneName = computed(() => paymentTone(payment.value))

const paymentLabel = computed(() => {
  const t = locale.t.orders
  switch (payment.value) {
    case 'unpaid': return t.paymentUnpaid
    case 'pending': return t.paymentPending
    case 'paid': return t.paymentPaid
    case 'failed': return t.paymentFailed
    case 'reverted': return t.paymentReverted
    default: return t.paymentNone
  }
})

const amountLabel = computed(() => {
  // Before any payment attempt exists, the sum owed is the accepted offer's.
  const amount = props.order.payment?.amount_som
    ?? props.order.offers?.find(o => o.status === 'accepted')?.price
  return amount != null && amount !== '' ? formatPrice(amount) : null
})

/** Card + paid-at once the money cleared; what is expected before that. */
const paymentMeta = computed(() => {
  const p = props.order.payment

  if (payment.value === 'paid') {
    const parts = [
      (p?.paid_at ?? props.order.paid_at) ? formatDateTime(p?.paid_at ?? props.order.paid_at) : null,
      p?.card_pan,
    ]
    return parts.filter(Boolean).join(' · ') || null
  }

  // Cash / bank transfer already requested — a manager has to confirm it.
  if (payment.value === 'pending' && p && p.method !== 'multicard') {
    return locale.t.orders.pay.offlinePending
  }

  if (payment.value === 'unpaid') {
    return props.order.payment_due_at
      ? `${locale.t.orders.pay.dueLabel}: ${formatDateTime(props.order.payment_due_at)}`
      : locale.t.orders.paymentDeadlineHint
  }

  return p ? null : locale.t.orders.paymentNoneHint
})

const TONE_CLASS: Record<StateTone, string> = {
  info: 'bg-secondary text-secondary-foreground',
  success: 'bg-success/12 text-success',
  warning: 'bg-accent text-accent-foreground',
  danger: 'bg-destructive/12 text-destructive',
  muted: 'bg-muted text-muted-foreground',
}
</script>

<template>
  <div class="state-card">
    <!-- Where the work is -->
    <div class="space-y-3 p-4">
      <div class="flex items-center justify-between gap-3">
        <p class="state-label">
          {{ locale.t.orders.stateOrderLabel }}
        </p>
        <span
          class="state-chip"
          :class="TONE_CLASS[statusTone]"
        >
          <span
            v-if="statusTone === 'info'"
            class="size-[7px] rounded-full bg-primary"
          />
          <Clock
            v-else-if="statusTone === 'warning'"
            class="size-3.5"
          />
          <Check
            v-else-if="statusTone === 'success'"
            class="size-3.5"
          />
          {{ statusLabel }}
        </span>
      </div>

      <!-- Four-beat rail: request → offer → in progress → done -->
      <div
        v-if="order.status !== 'cancelled'"
        class="grid grid-cols-4 gap-1.5"
      >
        <div
          v-for="(label, index) in steps"
          :key="label"
          class="flex flex-col gap-1.5"
        >
          <span
            class="h-1 rounded-full transition-colors"
            :class="index < step ? 'bg-primary' : 'bg-border'"
          />
          <span
            class="truncate text-[10.5px]"
            :class="index < step ? 'font-bold text-primary' : 'font-medium text-muted-foreground'"
          >{{ label }}</span>
        </div>
      </div>

      <p
        v-if="hint"
        class="text-[12.5px] leading-snug text-muted-foreground"
      >
        {{ hint }}
      </p>
    </div>

    <!-- Where the money is -->
    <div class="state-payment">
      <div class="flex items-center justify-between gap-3">
        <p class="state-label">
          {{ locale.t.orders.statePaymentLabel }}
        </p>
        <span
          class="state-chip"
          :class="TONE_CLASS[paymentToneName]"
        >
          <Check
            v-if="payment === 'paid'"
            class="size-3.5"
          />
          <AlertCircle
            v-else-if="payment === 'unpaid' || payment === 'failed'"
            class="size-3.5"
          />
          <RotateCcw
            v-else-if="payment === 'reverted'"
            class="size-3.5"
          />
          <Clock
            v-else-if="payment === 'pending'"
            class="size-3.5"
          />
          {{ paymentLabel }}
        </span>
      </div>

      <div
        v-if="amountLabel"
        class="space-y-1"
      >
        <p class="rb-font-display text-[22px] font-extrabold tabular-nums leading-tight tracking-[-0.02em] text-foreground">
          {{ amountLabel }}
        </p>
        <p
          v-if="paymentMeta"
          class="text-[11.5px] text-muted-foreground"
        >
          {{ paymentMeta }}
        </p>
      </div>
      <p
        v-else-if="paymentMeta"
        class="text-[12px] text-muted-foreground"
      >
        {{ paymentMeta }}
      </p>

      <!-- The state's single primary action -->
      <slot name="action" />
    </div>
  </div>
</template>

<style scoped>
.state-card {
  border-radius: var(--rb-r-card);
  background: var(--card);
  border: 1px solid var(--border);
  box-shadow: var(--rb-elev-1);
  overflow: hidden;
}

.state-label {
  margin: 0;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted-foreground);
}

.state-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 26px;
  padding: 0 11px;
  border-radius: var(--rb-r-chip);
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

/* The payment band reads as its own surface, not a continuation of the status. */
.state-payment {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px 16px;
  border-top: 1px solid var(--border);
  background: color-mix(in srgb, var(--muted) 45%, var(--card));
}
</style>
