<script setup lang="ts">
import { Banknote, Building2, Check, Copy, CreditCard, Download, Loader2, QrCode, Send } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import QRCode from 'qrcode'
import Drawer from '@/core/ui/Drawer.vue'
import { Button } from '@/core/ui/button'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { useToast } from '@/core/composables/useToast'
import { useTelegram } from '@/core/composables/useTelegram'
import { formatPrice } from '@/modules/orders/lib/order-status'
import { useOrdersStore } from '@/modules/orders/stores/orders.store'
import type { Payment } from '@/modules/orders/types/order'

/**
 * How the client settles an active deal. The order is already running — this
 * only decides where the money comes from:
 *  - card/wallet now (Multicard checkout),
 *  - an invoice link/QR paid later from any wallet (still Multicard),
 *  - cash at the platform's desk or a bank transfer, confirmed by a manager.
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

type Step = 'choose' | 'invoice' | 'offline'

const step = ref<Step>('choose')
const invoice = ref<Payment | null>(null)
const qrDataUrl = ref<string | null>(null)
const offlineMethod = ref<'cash' | 'bank_transfer'>('cash')
const smsSent = ref(false)

// Every open starts from the method list; an already pending offline invoice
// is shown straight away so the client can re-read the instructions.
watch(open, (isOpen) => {
  if (!isOpen) {
    step.value = 'choose'
    invoice.value = null
    qrDataUrl.value = null
    smsSent.value = false
    return
  }

  const pending = props.payment
  if (pending && pending.method !== 'multicard' && ['draft', 'progress'].includes(pending.status)) {
    invoice.value = pending
    offlineMethod.value = pending.method === 'cash' ? 'cash' : 'bank_transfer'
    step.value = 'offline'
  }
})

const amountLabel = computed(() => formatPrice(props.amount))

const shareUrl = computed(() => invoice.value?.share_url ?? invoice.value?.checkout_url ?? null)

async function renderQr(url: string) {
  try {
    qrDataUrl.value = await QRCode.toDataURL(url, { margin: 1, width: 480 })
  }
  catch {
    qrDataUrl.value = null
  }
}

async function payOnline() {
  haptic('light')
  await orders.payForOrder(props.orderId)
  if (orders.error) toast.error(orders.error)
}

async function openInvoice(sendSms = false) {
  haptic('light')
  const payment = await orders.requestInvoice(props.orderId, sendSms)
  if (!payment) {
    if (orders.error) toast.error(orders.error)
    return
  }
  invoice.value = payment
  step.value = 'invoice'
  if (sendSms) smsSent.value = true
  const url = payment.share_url ?? payment.checkout_url
  if (url) await renderQr(url)
}

async function chooseOffline(method: 'cash' | 'bank_transfer') {
  haptic('light')
  offlineMethod.value = method
  const payment = await orders.requestOfflineInvoice(props.orderId, method)
  if (!payment) {
    if (orders.error) toast.error(orders.error)
    return
  }
  invoice.value = payment
  step.value = 'offline'
}

async function copyLink() {
  if (!shareUrl.value) return
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    haptic('light')
    toast.success(locale.t.orders.pay.linkCopied)
  }
  catch {
    toast.error(locale.t.orders.pay.linkCopyFailed)
  }
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
          @click="payOnline"
        >
          <span class="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
            <CreditCard class="size-5" />
          </span>
          <span class="min-w-0">
            <span class="block text-sm font-semibold text-foreground">
              {{ locale.t.orders.pay.onlineTitle }}
            </span>
            <span class="mt-0.5 block text-[12px] leading-snug text-muted-foreground">
              {{ locale.t.orders.pay.onlineHint }}
            </span>
          </span>
        </button>

        <button
          type="button"
          class="pressable flex w-full items-start gap-3 rounded-2xl border border-border/70 px-4 py-3.5 text-left"
          :disabled="orders.isSubmitting"
          @click="openInvoice(false)"
        >
          <span class="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
            <QrCode class="size-5" />
          </span>
          <span class="min-w-0">
            <span class="block text-sm font-semibold text-foreground">
              {{ locale.t.orders.pay.invoiceTitle }}
            </span>
            <span class="mt-0.5 block text-[12px] leading-snug text-muted-foreground">
              {{ locale.t.orders.pay.invoiceHint }}
            </span>
          </span>
        </button>

        <button
          type="button"
          class="pressable flex w-full items-start gap-3 rounded-2xl border border-border/70 px-4 py-3.5 text-left"
          :disabled="orders.isSubmitting"
          @click="chooseOffline('cash')"
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
          @click="chooseOffline('bank_transfer')"
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

      <!-- 2a. Shareable Multicard invoice: QR + link + SMS -->
      <template v-else-if="step === 'invoice'">
        <p class="text-[13px] leading-relaxed text-muted-foreground">
          {{ locale.t.orders.pay.invoiceBody }}
        </p>

        <div
          v-if="qrDataUrl"
          class="flex justify-center rounded-2xl bg-white p-4"
        >
          <img
            :src="qrDataUrl"
            :alt="locale.t.orders.pay.invoiceTitle"
            class="size-52"
          >
        </div>

        <p
          v-if="shareUrl"
          class="break-all rounded-2xl bg-muted/50 px-3.5 py-3 text-[11px] text-muted-foreground dark:bg-white/5"
        >
          {{ shareUrl }}
        </p>

        <div class="flex gap-2">
          <Button
            variant="outline"
            class="h-11 flex-1 rounded-2xl"
            :disabled="!shareUrl"
            @click="copyLink"
          >
            <Copy class="size-4" />
            {{ locale.t.orders.pay.copyLink }}
          </Button>
          <Button
            variant="outline"
            class="h-11 flex-1 rounded-2xl"
            :disabled="orders.isSubmitting || smsSent"
            @click="openInvoice(true)"
          >
            <Check
              v-if="smsSent"
              class="size-4"
            />
            <Send
              v-else
              class="size-4"
            />
            {{ smsSent ? locale.t.orders.pay.smsSent : locale.t.orders.pay.sendSms }}
          </Button>
        </div>

        <Button
          class="btn-brand h-12 w-full rounded-2xl text-base font-semibold"
          @click="payOnline"
        >
          <CreditCard class="size-4" />
          {{ locale.t.orders.pay.payNowInstead }}
        </Button>
      </template>

      <!-- 2b. Cash / bank transfer: invoice + manager confirmation -->
      <template v-else>
        <p class="text-[13px] leading-relaxed text-muted-foreground">
          {{ offlineMethod === 'cash'
            ? locale.t.orders.pay.cashBody
            : locale.t.orders.pay.bankBody }}
        </p>

        <div class="rounded-2xl bg-amber-500/10 px-3.5 py-3 text-[12px] leading-snug text-amber-700 dark:text-amber-300">
          {{ locale.t.orders.pay.offlinePending }}
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
