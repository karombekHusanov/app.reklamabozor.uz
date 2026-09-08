<script setup lang="ts">
import { AlertTriangle, ArrowRight, Check, CreditCard, FileText, Loader2, X } from '@lucide/vue'
import { computed } from 'vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import Badge from '@/core/ui/Badge.vue'
import { Button } from '@/core/ui/button'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { openCheckout } from '@/core/lib/telegram-init'
import { formatDateTime } from '@/core/lib/date'
import { formatPrice } from '@/modules/orders/lib/order-status'
import type { Amendment } from '@/modules/orders/types/order'

const props = defineProps<{ amendment: Amendment, submitting?: boolean }>()

const emit = defineEmits<{
  approve: [id: number]
  reject: [id: number]
  cancel: [id: number]
}>()

const locale = useLocaleStore()

const a = computed(() => props.amendment)

const statusVariant = computed<'success' | 'warning' | 'default'>(() => {
  switch (a.value.status) {
    case 'applied': return 'success'
    case 'pending':
    case 'approved': return 'warning'
    default: return 'default'
  }
})

const statusLabel = computed(() => locale.t.amendments.status[a.value.status] ?? a.value.status)

const extra = computed(() => Number(a.value.extra_amount))
const deadlineChanged = computed(() => a.value.before.deadline_days !== a.value.after.deadline_days)

function deadlineLabel(days: number | null): string {
  return days == null ? '—' : `${days} ${locale.t.amendments.days}`
}

// Extra payment is due once approved but not yet applied and a checkout exists
// (legacy rows only — new amendments put the extra on the order's balance).
const showPayCta = computed(() =>
  a.value.status === 'approved' && !!a.value.payment?.checkout_url,
)

/** Money outcome of an applied addendum, in the reader's own terms. */
const moneyNote = computed(() => {
  if (a.value.status !== 'applied') return null
  if (a.value.refund?.state === 'refunded') {
    return `${locale.t.amendments.refundPaid}: ${formatPrice(a.value.refund.amount)}`
  }
  if (a.value.refund?.state === 'due') {
    return `${locale.t.amendments.refundDue}: ${formatPrice(a.value.refund.amount)}`
  }
  if (extra.value > 0) {
    return `${locale.t.amendments.chargeDue}: ${formatPrice(extra.value)}`
  }
  return null
})

const moneyTone = computed(() =>
  a.value.refund?.state === 'due' || a.value.refund?.state === 'refunded'
    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
    : 'bg-primary/10 text-primary',
)

function pay() {
  if (a.value.payment?.checkout_url) openCheckout(a.value.payment.checkout_url)
}
</script>

<template>
  <GlassCard class="space-y-3">
    <div class="flex items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <span class="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <FileText class="size-4" />
        </span>
        <div class="leading-tight">
          <p class="text-[13px] font-bold text-foreground">
            {{ a.number ?? locale.t.amendments.title }}
          </p>
          <p class="text-[11px] text-muted-foreground">
            {{ a.initiator_role === 'agent' ? locale.t.amendments.byAgent : locale.t.amendments.byClient }}
          </p>
        </div>
      </div>
      <Badge :variant="statusVariant">
        {{ statusLabel }}
      </Badge>
    </div>

    <p
      v-if="a.reason"
      class="rounded-xl bg-muted/50 px-3 py-2 text-xs leading-relaxed text-muted-foreground dark:bg-white/5"
    >
      {{ a.reason }}
    </p>

    <!-- What the change costs (or gives back) once it is in force -->
    <div
      v-if="moneyNote"
      class="rounded-xl px-3 py-2 text-[11.5px] font-medium leading-relaxed"
      :class="moneyTone"
    >
      {{ moneyNote }}
    </div>

    <p
      v-if="a.status === 'pending' && a.expires_at"
      class="text-[11px] text-muted-foreground"
    >
      {{ locale.t.amendments.answerBy }}: {{ formatDateTime(a.expires_at) }}
    </p>

    <p
      v-if="a.status === 'pending' && a.requires_operator && a.approvals.client && a.approvals.agent"
      class="text-[11px] font-medium text-amber-600 dark:text-amber-400"
    >
      {{ locale.t.amendments.awaitingOperator }}
    </p>

    <!-- Terms change summary -->
    <div class="space-y-2 rounded-xl border border-border/60 p-3">
      <div class="flex items-center justify-between gap-2 text-sm">
        <span class="text-muted-foreground">{{ locale.t.amendments.total }}</span>
        <span class="flex items-center gap-1.5 font-semibold tabular-nums">
          <span class="text-muted-foreground line-through">{{ formatPrice(a.before.total) }}</span>
          <ArrowRight class="size-3.5 text-muted-foreground" />
          <span class="text-foreground">{{ formatPrice(a.after.total) }}</span>
        </span>
      </div>
      <div
        v-if="deadlineChanged"
        class="flex items-center justify-between gap-2 text-sm"
      >
        <span class="text-muted-foreground">{{ locale.t.amendments.deadline }}</span>
        <span class="flex items-center gap-1.5 font-semibold">
          <span class="text-muted-foreground line-through">{{ deadlineLabel(a.before.deadline_days) }}</span>
          <ArrowRight class="size-3.5 text-muted-foreground" />
          <span class="text-foreground">{{ deadlineLabel(a.after.deadline_days) }}</span>
        </span>
      </div>
      <div
        v-if="extra > 0"
        class="flex items-center justify-between gap-2 text-sm"
      >
        <span class="text-muted-foreground">{{ locale.t.amendments.extraPayment }}</span>
        <span class="font-bold tabular-nums text-primary">+{{ formatPrice(a.extra_amount) }}</span>
      </div>
    </div>

    <!-- Approval progress -->
    <div class="flex flex-wrap gap-2">
      <span
        v-for="party in (['client', 'agent'] as const)"
        :key="party"
        class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium"
        :class="a.approvals[party]
          ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400'
          : 'bg-muted/60 text-muted-foreground dark:bg-white/5'"
      >
        <Check
          v-if="a.approvals[party]"
          class="size-3"
        />
        {{ party === 'client' ? locale.t.amendments.partyClient : locale.t.amendments.partyAgent }}
      </span>
      <span
        v-if="a.requires_operator"
        class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium"
        :class="a.approvals.operator
          ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400'
          : 'bg-muted/60 text-muted-foreground dark:bg-white/5'"
      >
        <Check
          v-if="a.approvals.operator"
          class="size-3"
        />
        {{ locale.t.amendments.partyOperator }}
      </span>
    </div>

    <div
      v-if="a.requires_formal_doc"
      class="flex items-start gap-2 rounded-xl bg-amber-500/10 px-3 py-2 text-[11px] leading-relaxed text-amber-700 dark:text-amber-400"
    >
      <AlertTriangle class="mt-0.5 size-3.5 shrink-0" />
      <span>{{ locale.t.amendments.formalDocNote }}</span>
    </div>

    <p
      v-if="a.status === 'rejected' && a.rejection_reason"
      class="text-xs text-destructive"
    >
      {{ locale.t.amendments.rejectedReason }}: {{ a.rejection_reason }}
    </p>

    <a
      v-if="a.pdf_url"
      :href="a.pdf_url"
      target="_blank"
      rel="noopener"
      class="inline-flex items-center gap-1.5 text-xs font-semibold text-primary"
    >
      <FileText class="size-3.5" />
      {{ locale.t.amendments.downloadPdf }}
    </a>

    <!-- Actions -->
    <Button
      v-if="showPayCta"
      class="h-11 w-full rounded-2xl"
      @click="pay"
    >
      <CreditCard class="size-4" />
      {{ locale.t.amendments.payExtra }} · {{ formatPrice(a.extra_amount) }}
    </Button>

    <div
      v-if="a.can_approve"
      class="flex gap-2"
    >
      <Button
        class="h-11 flex-1 rounded-2xl"
        :disabled="submitting"
        @click="emit('approve', a.id)"
      >
        <Loader2
          v-if="submitting"
          class="size-4 animate-spin"
        />
        <Check
          v-else
          class="size-4"
        />
        {{ locale.t.amendments.approve }}
      </Button>
      <Button
        variant="outline"
        class="h-11 rounded-2xl text-destructive"
        :disabled="submitting"
        @click="emit('reject', a.id)"
      >
        <X class="size-4" />
        {{ locale.t.amendments.reject }}
      </Button>
    </div>

    <Button
      v-else-if="a.can_cancel"
      variant="outline"
      class="h-10 w-full rounded-2xl text-destructive"
      :disabled="submitting"
      @click="emit('cancel', a.id)"
    >
      {{ locale.t.amendments.cancel }}
    </Button>
  </GlassCard>
</template>
