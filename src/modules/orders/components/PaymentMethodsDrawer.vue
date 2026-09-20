<script setup lang="ts">
import { Banknote, Building2, Download, Loader2, Wallet } from '@lucide/vue'
import { ref, watch, computed } from 'vue'
import Drawer from '@/core/ui/Drawer.vue'
import { Button } from '@/core/ui/button'
import Badge from '@/core/ui/Badge.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { useToast } from '@/core/composables/useToast'
import { useTelegram } from '@/core/composables/useTelegram'
import { formatPrice } from '@/modules/orders/lib/order-status'
import { useOrdersStore } from '@/modules/orders/stores/orders.store'
import type { Payment } from '@/modules/orders/types/order'

/**
 * How the client settles an active deal. The order is already running — this
 * only decides where the money comes from: cash at the platform's desk, or a
 * bank transfer, both confirmed by a manager. A future card gateway (Atmos)
 * will need its own 100%/50% support built in.
 */
const props = defineProps<{
  orderId: number
  /** Amount owed, in som. */
  amount: string | number | null
  /** The pending payment already on this order, if any. */
  payment?: Payment | null
}>()

const open = defineModel<boolean>('open', { default: false })

const locale = useLocaleStore()
const toast = useToast()
const orders = useOrdersStore()
const { haptic } = useTelegram()

type Step = 'choose' | 'percent' | 'offline'

const step = ref<Step>('choose')
const invoice = ref<Payment | null>(null)
const offlineMethod = ref<'cash' | 'bank_transfer'>('cash')
/** Offline method picked in the 'choose' step, awaiting a percent choice. */
const pendingOfflineMethod = ref<'cash' | 'bank_transfer' | null>(null)
/** Percent the client picked (or the backend confirmed) for the last offline payment. */
const chosenPercent = ref<100 | 50>(100)

// Every open starts from the method list; an already pending offline invoice
// is shown straight away so the client can re-read the instructions.
watch(open, (isOpen) => {
  if (!isOpen) {
    step.value = 'choose'
    invoice.value = null
    pendingOfflineMethod.value = null
    return
  }

  const pending = props.payment
  if (pending && ['draft', 'progress'].includes(pending.status)) {
    invoice.value = pending
    offlineMethod.value = pending.method === 'cash' ? 'cash' : 'bank_transfer'
    chosenPercent.value = pending.percent === 50 ? 50 : 100
    step.value = 'offline'
  }
})

const amountLabel = computed(() => formatPrice(props.amount))

/** Numeric amount owed, for the illustrative 50% preview below. */
const numericAmount = computed(() => {
  const n = typeof props.amount === 'string' ? Number(props.amount) : props.amount
  return n == null || Number.isNaN(n) ? null : n
})

// Preview-only math for the 50% option's subtitle — purely illustrative so the
// client knows roughly what they'll owe now; the backend is the source of
// truth for the actual amount once the offline invoice is created.
const halfAmountLabel = computed(() => {
  if (numericAmount.value == null) return ''
  return formatPrice(Math.round(numericAmount.value / 2))
})

/** Cash or bank transfer row tapped — ask how much of the balance first. */
function pickOfflineMethod(method: 'cash' | 'bank_transfer') {
  haptic('light')
  pendingOfflineMethod.value = method
  step.value = 'percent'
}

async function chooseOffline(method: 'cash' | 'bank_transfer', percent: 100 | 50) {
  haptic('light')
  offlineMethod.value = method
  const payment = await orders.requestOfflineInvoice(props.orderId, method, percent)
  if (!payment) {
    if (orders.error) toast.error(orders.error)
    return
  }
  invoice.value = payment
  chosenPercent.value = payment.percent === 50 ? 50 : percent
  step.value = 'offline'
}
</script>

<template>
  <Drawer
    v-model:open="open"
    :title="locale.t.orders.pay.title"
  >
    <div class="space-y-4 pb-4">
      <!-- Amount owed -->
      <div class="flex items-center justify-between gap-3 rounded-2xl bg-primary/10 px-4 py-3">
        <span class="text-sm font-semibold text-foreground">
          {{ locale.t.orders.pay.amountDue }}
        </span>
        <span class="rb-font-display text-lg font-bold tabular-nums text-primary">
          {{ amountLabel }}
        </span>
      </div>

      <!-- 1. Pick a method -->
      <template v-if="step === 'choose'">
        <button
          type="button"
          class="pressable flex w-full items-start gap-3 rounded-2xl border border-border/70 px-4 py-3.5 text-left"
          :disabled="orders.isSubmitting"
          @click="pickOfflineMethod('cash')"
        >
          <span class="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
            <Banknote class="size-5" />
          </span>
          <span class="min-w-0">
            <span class="block text-sm font-semibold text-foreground">
              {{ locale.t.orders.pay.cashTitle }}
            </span>
            <span class="mt-0.5 block text-[12px] leading-snug text-muted-foreground">
              {{ locale.t.orders.pay.cashHint }}
            </span>
          </span>
        </button>

        <button
          type="button"
          class="pressable flex w-full items-start gap-3 rounded-2xl border border-border/70 px-4 py-3.5 text-left"
          :disabled="orders.isSubmitting"
          @click="pickOfflineMethod('bank_transfer')"
        >
          <span class="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
            <Building2 class="size-5" />
          </span>
          <span class="min-w-0">
            <span class="block text-sm font-semibold text-foreground">
              {{ locale.t.orders.pay.bankTitle }}
            </span>
            <span class="mt-0.5 block text-[12px] leading-snug text-muted-foreground">
              {{ locale.t.orders.pay.bankHint }}
            </span>
          </span>
        </button>

        <p
          v-if="orders.isSubmitting"
          class="flex items-center justify-center gap-2 text-xs text-muted-foreground"
        >
          <Loader2 class="size-3.5 animate-spin" />
          {{ locale.t.common.loading }}
        </p>
      </template>

      <!-- 1b. Offline method chosen — how much of the balance now? -->
      <template v-else-if="step === 'percent'">
        <button
          type="button"
          class="pressable flex w-full items-start gap-3 rounded-2xl border border-border/70 px-4 py-3.5 text-left"
          :disabled="orders.isSubmitting"
          @click="pendingOfflineMethod && chooseOffline(pendingOfflineMethod, 100)"
        >
          <span class="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
            <Wallet class="size-5" />
          </span>
          <span class="min-w-0">
            <span class="block text-sm font-semibold text-foreground">
              {{ locale.t.orders.pay.percentFullTitle }}
            </span>
            <span class="mt-0.5 block text-[12px] leading-snug text-muted-foreground">
              {{ locale.t.orders.pay.percentFullHint }} — {{ amountLabel }}
            </span>
          </span>
        </button>

        <button
          type="button"
          class="pressable flex w-full items-start gap-3 rounded-2xl border border-border/70 px-4 py-3.5 text-left"
          :disabled="orders.isSubmitting"
          @click="pendingOfflineMethod && chooseOffline(pendingOfflineMethod, 50)"
        >
          <span class="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
            <Wallet class="size-5" />
          </span>
          <span class="min-w-0">
            <span class="block text-sm font-semibold text-foreground">
              {{ locale.t.orders.pay.percentHalfTitle }}
            </span>
            <span class="mt-0.5 block text-[12px] leading-snug text-muted-foreground">
              {{ locale.t.orders.pay.percentHalfHint }} — {{ halfAmountLabel }}
            </span>
          </span>
        </button>

        <p
          v-if="orders.isSubmitting"
          class="flex items-center justify-center gap-2 text-xs text-muted-foreground"
        >
          <Loader2 class="size-3.5 animate-spin" />
          {{ locale.t.common.loading }}
        </p>

        <Button
          variant="outline"
          class="h-11 w-full rounded-2xl"
          :disabled="orders.isSubmitting"
          @click="step = 'choose'"
        >
          {{ locale.t.orders.pay.otherMethod }}
        </Button>
      </template>

      <!-- 2. Cash / bank transfer: invoice + manager confirmation -->
      <template v-else>
        <p class="text-[13px] leading-relaxed text-muted-foreground">
          {{ offlineMethod === 'cash'
            ? locale.t.orders.pay.cashBody
            : locale.t.orders.pay.bankBody }}
        </p>

        <div class="flex items-center justify-between gap-3 rounded-2xl bg-amber-500/10 px-3.5 py-3 text-[12px] leading-snug text-amber-700 dark:text-amber-300">
          <span>{{ locale.t.orders.pay.offlinePending }}</span>
          <Badge variant="primary">
            {{ locale.t.orders.pay.percentBadge.replace('{percent}', String(invoice?.percent ?? chosenPercent)) }}
          </Badge>
        </div>

        <a
          v-if="invoice?.invoice_url"
          :href="invoice.invoice_url"
          target="_blank"
          rel="noopener"
          class="pressable flex items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary"
        >
          <Download class="size-4" />
          {{ locale.t.orders.pay.downloadInvoice }}
        </a>

        <Button
          variant="outline"
          class="h-11 w-full rounded-2xl"
          @click="step = 'choose'"
        >
          {{ locale.t.orders.pay.otherMethod }}
        </Button>
      </template>
    </div>
  </Drawer>
</template>
