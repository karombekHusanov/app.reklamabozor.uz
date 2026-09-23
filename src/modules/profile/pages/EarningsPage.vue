<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { AlertTriangle, Building2 } from '@lucide/vue'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import EmptyState from '@/core/ui/EmptyState.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { useToast } from '@/core/composables/useToast'
import PropuskCard from '@/modules/agent/components/PropuskCard.vue'
import { usePassStore } from '@/modules/agent/stores/pass.store'
import { earningsStrings } from '@/modules/profile/lib/earnings-i18n'
import { fetchEarnings } from '@/modules/profile/services/earnings.service'
import type {
  EarningsBalance,
  Payout,
  PayoutDestination,
} from '@/modules/profile/types/earnings'

const locale = useLocaleStore()
const toast = useToast()
const passStore = usePassStore()

const t = computed(() => earningsStrings(locale.locale))

const loading = ref(true)
const balance = ref<EarningsBalance | null>(null)
const payouts = ref<Payout[]>([])
const destination = ref<PayoutDestination | null>(null)

// Earnings are transferred to the agent's bank account by a manager.
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

function statusTone(status: Payout['status']): string {
  if (status === 'paid') return 'earnings-chip--paid'
  if (status === 'processing') return 'earnings-chip--processing'
  if (status === 'failed' || status === 'cancelled') return 'earnings-chip--muted'
  return 'earnings-chip--pending'
}

onMounted(() => {
  void load()
  void passStore.loadHistory()
})
</script>

<template>
  <div class="pb-24">
    <AppHeader :title="t.title" :subtitle="t.subtitle" show-back />

    <section class="space-y-4 px-4">
      <PropuskCard show-history />

      <!-- Balance -->
      <GlassCard v-if="loading" class="space-y-3">
        <Skeleton class="h-4 w-24" />
        <Skeleton class="h-9 w-40" />
      </GlassCard>

      <GlassCard v-else-if="balance" class="space-y-4">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {{ t.owed }}
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

        <!-- Bank channel: no self-service cash-out, just where it lands -->
        <div class="space-y-4">
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
        </div>
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
