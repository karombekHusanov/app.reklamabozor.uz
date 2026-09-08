<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { AlertTriangle, Building2, CreditCard, Wallet } from '@lucide/vue'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import EmptyState from '@/core/ui/EmptyState.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import { Button } from '@/core/ui/button'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { useToast } from '@/core/composables/useToast'
import { useTelegram } from '@/core/composables/useTelegram'
import { openExternalLink } from '@/core/lib/telegram-init'
import { earningsStrings } from '@/modules/profile/lib/earnings-i18n'
import {
  cancelWithdrawal,
  confirmWithdrawal,
  fetchEarnings,
  fetchWithdrawal,
  startWithdrawal,
} from '@/modules/profile/services/earnings.service'
import type {
  EarningsBalance,
  Payout,
  PayoutDestination,
  Withdrawal,
} from '@/modules/profile/types/earnings'

const locale = useLocaleStore()
const toast = useToast()
const { haptic } = useTelegram()

const t = computed(() => earningsStrings(locale.locale))

const loading = ref(true)
const balance = ref<EarningsBalance | null>(null)
const payouts = ref<Payout[]>([])
const destination = ref<PayoutDestination | null>(null)

// Active withdrawal flow.
const withdrawal = ref<Withdrawal | null>(null)
const busy = ref(false)
const otp = ref('')
let poll: ReturnType<typeof setInterval> | null = null

const canWithdraw = computed(() => (balance.value?.available ?? 0) > 0)

// Earnings are transferred to the agent's bank account by a manager; the card
// cash-out only appears where the platform has it switched on.
const cardWithdrawal = computed(() => destination.value?.card_withdrawal_enabled === true)
const bank = computed(() => destination.value?.bank ?? null)

function money(som: number): string {
  return new Intl.NumberFormat('ru-RU').format(Math.round(som))
}

async function load() {
  loading.value = true
  try {
    const res = await fetchEarnings()
    balance.value = res.balance
    payouts.value = res.items
    destination.value = res.payout
  }
  catch {
    toast.error(t.value.genericError)
  }
  finally {
    loading.value = false
  }
}

function stopPolling() {
  if (poll) {
    clearInterval(poll)
    poll = null
  }
}

async function beginWithdraw() {
  if (!canWithdraw.value || busy.value) return
  haptic('light')
  busy.value = true
  try {
    withdrawal.value = await startWithdrawal()
    if (withdrawal.value.form_url) {
      openExternalLink(withdrawal.value.form_url)
      toast.info(t.value.formOpened)
    }
    startPolling()
  }
  catch (e: any) {
    toast.error(e?.response?.data?.message || t.value.noFunds)
  }
  finally {
    busy.value = false
  }
}

function startPolling() {
  stopPolling()
  poll = setInterval(() => void refreshWithdrawal(true), 3500)
}

async function refreshWithdrawal(silent = false) {
  if (!withdrawal.value) return
  if (!silent) busy.value = true
  try {
    const w = await fetchWithdrawal(withdrawal.value.id, silent)
    withdrawal.value = w
    if (w.status === 'otp_required') stopPolling()
    if (w.status === 'success') {
      stopPolling()
      toast.success(t.value.success)
      resetFlow()
      await load()
    }
    if (w.status === 'failed') {
      stopPolling()
      toast.error(t.value.failed)
    }
  }
  catch {
    if (!silent) toast.error(t.value.genericError)
  }
  finally {
    if (!silent) busy.value = false
  }
}

async function submitOtp() {
  if (!withdrawal.value || otp.value.trim().length === 0 || busy.value) return
  haptic('light')
  busy.value = true
  try {
    const w = await confirmWithdrawal(withdrawal.value.id, otp.value.trim())
    withdrawal.value = w
    if (w.status === 'success') {
      toast.success(t.value.success)
      resetFlow()
      await load()
    }
    else {
      toast.error(t.value.failed)
    }
  }
  catch (e: any) {
    toast.error(e?.response?.data?.message || t.value.genericError)
  }
  finally {
    busy.value = false
  }
}

async function abort() {
  if (!withdrawal.value) return
  busy.value = true
  try {
    await cancelWithdrawal(withdrawal.value.id)
  }
  catch { /* best effort */ }
  finally {
    busy.value = false
    resetFlow()
    await load()
  }
}

function resetFlow() {
  stopPolling()
  withdrawal.value = null
  otp.value = ''
}

function statusTone(status: Payout['status']): string {
  if (status === 'paid') return 'earnings-chip--paid'
  if (status === 'processing') return 'earnings-chip--processing'
  if (status === 'failed' || status === 'cancelled') return 'earnings-chip--muted'
  return 'earnings-chip--pending'
}

// Returning from the hosted card form (tab visible again): re-check at once so
// an OTP-less credit shows its result immediately instead of after a poll tick.
function onVisible() {
  if (document.visibilityState !== 'visible') return
  if (withdrawal.value && !['success', 'failed', 'cancelled'].includes(withdrawal.value.status)) {
    void refreshWithdrawal(true)
  }
}

onMounted(() => {
  void load()
  document.addEventListener('visibilitychange', onVisible)
})
onBeforeUnmount(() => {
  stopPolling()
  document.removeEventListener('visibilitychange', onVisible)
})
</script>

<template>
  <div class="pb-24">
    <AppHeader :title="t.title" :subtitle="t.subtitle" show-back />

    <section class="space-y-4 px-4">
      <!-- Balance -->
      <GlassCard v-if="loading" class="space-y-3">
        <Skeleton class="h-4 w-24" />
        <Skeleton class="h-9 w-40" />
      </GlassCard>

      <GlassCard v-else-if="balance" class="space-y-4">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {{ cardWithdrawal ? t.available : t.owed }}
          </p>
          <p class="rb-font-display mt-1 text-[28px] font-extrabold tabular-nums tracking-[-0.02em] text-foreground">
            {{ money(balance.available_som) }} <span class="text-base font-bold text-muted-foreground">{{ balance.currency }}</span>
          </p>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div class="glass-chip rounded-xl px-3 py-2">
            <p class="text-[10px] font-semibold uppercase text-muted-foreground">{{ t.processing }}</p>
            <p class="text-sm font-bold text-foreground">{{ money(balance.processing_som) }}</p>
          </div>
          <div class="glass-chip rounded-xl px-3 py-2">
            <p class="text-[10px] font-semibold uppercase text-muted-foreground">{{ t.paid }}</p>
            <p class="text-sm font-bold text-foreground">{{ money(balance.paid_som) }}</p>
          </div>
        </div>

        <template v-if="cardWithdrawal && !withdrawal">
          <Button
            size="lg"
            class="w-full"
            :disabled="!canWithdraw || busy"
            @click="beginWithdraw"
          >
            <CreditCard class="size-4" />
            {{ t.withdrawCta }}
          </Button>
          <p class="text-center text-[11px] text-muted-foreground">{{ t.withdrawHint }}</p>
        </template>

        <!-- Bank channel: no self-service cash-out, just where it lands -->
        <template v-else-if="!cardWithdrawal">
          <div class="glass-chip flex items-start gap-3 rounded-xl px-3 py-3">
            <span class="earnings-flow-icon shrink-0"><Building2 class="size-4" /></span>
            <div class="min-w-0">
              <p class="text-[13px] font-bold text-foreground">{{ t.bankTitle }}</p>
              <p class="mt-0.5 text-[11px] leading-snug text-muted-foreground">{{ t.bankHint }}</p>

              <div v-if="bank?.complete" class="mt-2 space-y-0.5">
                <p class="text-[12px] font-semibold text-foreground">{{ bank.bank_name }}</p>
                <p class="text-[11px] tabular-nums text-muted-foreground">
                  {{ t.bankAccount }}: {{ bank.bank_account }}
                </p>
                <p class="text-[11px] tabular-nums text-muted-foreground">
                  {{ t.bankMfo }}: {{ bank.mfo }}
                </p>
              </div>
            </div>
          </div>

          <!-- Requisites come from KYC and are admin-managed after approval. -->
          <div
            v-if="bank && !bank.complete"
            class="flex items-start gap-2 rounded-xl bg-amber-500/12 px-3 py-2.5 text-amber-700 dark:text-amber-300"
          >
            <AlertTriangle class="mt-0.5 size-4 shrink-0" />
            <span class="text-[11px] leading-snug">
              {{ t.bankMissing }} — <span class="font-semibold">{{ t.bankMissingCta }}</span>
            </span>
          </div>
        </template>
      </GlassCard>

      <!-- Active withdrawal flow -->
      <GlassCard v-if="withdrawal" class="space-y-3">
        <div class="flex items-center gap-2">
          <span class="earnings-flow-icon"><Wallet class="size-4" /></span>
          <div class="min-w-0">
            <p class="text-sm font-bold text-foreground">
              {{ money(withdrawal.amount_som) }} {{ withdrawal.currency }}
            </p>
            <p class="text-[11px] text-muted-foreground">
              <template v-if="withdrawal.status === 'card_pending'">{{ t.waitingCard }}</template>
              <template v-else-if="withdrawal.status === 'otp_required'">{{ t.enterOtp }}</template>
            </p>
          </div>
        </div>

        <!-- card_pending: reopen form + manual check -->
        <template v-if="withdrawal.status === 'card_pending'">
          <div class="flex gap-2">
            <Button
              variant="outline"
              size="lg"
              class="flex-1"
              :disabled="busy || !withdrawal.form_url"
              @click="withdrawal.form_url && openExternalLink(withdrawal.form_url)"
            >
              {{ t.openForm }}
            </Button>
            <Button size="lg" class="flex-1" :disabled="busy" @click="() => refreshWithdrawal(false)">
              {{ t.confirm }}
            </Button>
          </div>
        </template>

        <!-- otp_required: enter code -->
        <template v-else-if="withdrawal.status === 'otp_required'">
          <label class="block text-[11px] font-semibold text-muted-foreground">{{ t.otpLabel }}</label>
          <input
            v-model="otp"
            inputmode="numeric"
            autocomplete="one-time-code"
            class="glass-input w-full text-center text-lg tracking-widest"
            :placeholder="'••••••'"
          >
          <Button size="lg" class="w-full" :disabled="busy || !otp.trim()" @click="submitOtp">
            {{ t.confirm }}
          </Button>
        </template>

        <button type="button" class="w-full text-center text-[11px] text-muted-foreground" @click="abort">
          {{ t.cancel }}
        </button>
      </GlassCard>

      <!-- History -->
      <div>
        <h2 class="rb-sec__title mb-3 px-1 !text-[16px]">{{ t.history }}</h2>

        <div v-if="loading" class="space-y-2">
          <Skeleton v-for="i in 3" :key="i" class="h-16 w-full rounded-2xl" />
        </div>

        <EmptyState
          v-else-if="payouts.length === 0"
          :title="t.empty"
          :description="t.emptyHint"
        />

        <div v-else class="space-y-2">
          <GlassCard v-for="p in payouts" :key="p.id" padding="sm" class="flex items-center gap-3">
            <div class="min-w-0 flex-1">
              <p class="truncate text-[13px] font-semibold text-foreground">
                {{ p.order_title || `#${p.order_id}` }}
              </p>
              <p class="text-[11px] text-muted-foreground">{{ t.tranche[p.tranche] }}</p>
            </div>
            <div class="shrink-0 text-right">
              <p class="text-[13px] font-bold text-foreground">{{ money(p.amount_som) }}</p>
              <span class="earnings-chip" :class="statusTone(p.status)">{{ t.status[p.status] }}</span>
            </div>
          </GlassCard>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.earnings-chip {
  display: inline-block;
  margin-top: 2px;
  border-radius: 9999px;
  padding: 1px 8px;
  font-size: 10px;
  font-weight: 700;
}
.earnings-chip--paid { background: rgb(34 197 94 / 0.15); color: rgb(21 128 61); }
.earnings-chip--processing { background: rgb(59 130 246 / 0.15); color: rgb(29 78 216); }
.earnings-chip--pending { background: rgb(234 179 8 / 0.15); color: rgb(161 98 7); }
.earnings-chip--muted { background: rgb(148 163 184 / 0.18); color: rgb(71 85 105); }
.earnings-flow-icon {
  display: inline-flex;
  height: 32px;
  width: 32px;
  align-items: center;
  justify-content: center;
  border-radius: var(--rb-r-icon);
  background: var(--primary);
  color: var(--primary-foreground);
}
</style>
