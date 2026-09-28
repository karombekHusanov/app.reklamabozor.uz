<script setup lang="ts">
import { BadgeCheck, RotateCcw, Send } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Skeleton from '@/core/ui/Skeleton.vue'
import { useTelegram } from '@/core/composables/useTelegram'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { formatDateTime } from '@/core/lib/date'
import { fmtSom, passStrings } from '@/modules/agent/lib/pass-i18n'
import { DEFAULT_TOPUP_SOM, TOPUP_PRESETS } from '@/modules/agent/lib/topup'
import { fetchWallet } from '@/modules/agent/services/pass.service'
import { usePassStore } from '@/modules/agent/stores/pass.store'
import type { AgentWallet } from '@/modules/agent/types/pass'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import { ROUTES } from '@/modules/shell/constants/routes'

/**
 * Agent "Balance" tab: balance, amount picker, the otklik rules and recent
 * ledger. Paying itself stays on the card page (saved cards + SMS code).
 */
const locale = useLocaleStore()
const router = useRouter()
const pass = usePassStore()
const { haptic } = useTelegram()

const t = computed(() => locale.t.agentHome.balance)
const unit = computed(() => passStrings(locale.locale).unit)
const som = (n: number) => fmtSom(n, unit.value)

const wallet = ref<AgentWallet | null>(null)
const loading = ref(true)
const amount = ref(DEFAULT_TOPUP_SOM)

const fee = computed(() => pass.pass?.response_price_som || 0)
const balance = computed(() => wallet.value?.balance_som ?? pass.balanceSom)
const responsesFor = (n: number) => (fee.value > 0 ? Math.floor(n / fee.value) : 0)
const canTopup = computed(() => wallet.value?.enabled ?? pass.walletEnabled)

const rules = computed(() => [
  { icon: Send, tone: 'is-blue', text: t.value.rules[0]!.replace('{fee}', som(fee.value)) },
  { icon: BadgeCheck, tone: 'is-amber', text: t.value.rules[1] },
  { icon: RotateCcw, tone: 'is-green', text: t.value.rules[2] },
])

const history = computed(() => (wallet.value?.transactions ?? []).slice(0, 10).map(tx => ({
  ...tx,
  label: tx.note || t.value.types[tx.type] || tx.type,
  when: formatDateTime(tx.created_at),
  sum: `${tx.amount_som > 0 ? '+' : '−'} ${som(Math.abs(tx.amount_som))}`,
})))

function pick(value: number) {
  haptic('light')
  amount.value = value
}

function topup() {
  haptic('medium')
  void router.push(`${ROUTES.propuskPay}?topup=1&amount=${amount.value}`)
}

onMounted(async () => {
  void pass.ensureLoaded()
  try { wallet.value = await fetchWallet() }
  catch { wallet.value = null }
  finally { loading.value = false }
})
</script>

<template>
  <div class="ab">
    <AppHeader :title="t.title" />

    <section class="ab-card">
      <Skeleton
        v-if="loading"
        class="h-9 w-40 rounded-lg"
      />
      <p
        v-else
        class="ab-balance"
      >
        {{ som(balance) }}
      </p>
      <p
        v-if="fee"
        class="ab-muted"
      >
        {{ t.enough.replace('{count}', String(responsesFor(balance))) }}
      </p>

      <template v-if="canTopup">
        <p class="ab-label">
          {{ t.amount }}
        </p>
        <p class="ab-amount">
          {{ som(amount) }}
        </p>
        <div class="ab-chips">
          <button
            v-for="value in TOPUP_PRESETS"
            :key="value"
            type="button"
            class="ab-chip"
            :class="{ 'is-on': amount === value }"
            :aria-pressed="amount === value"
            @click="pick(value)"
          >
            {{ t.thousand.replace('{n}', String(value / 1000)) }}
          </button>
        </div>
        <p
          v-if="fee"
          class="ab-hint"
        >
          {{ t.amountHint.replace('{amount}', som(amount)).replace('{count}', String(responsesFor(amount))) }}
        </p>
      </template>

      <ul class="ab-rules">
        <li
          v-for="rule in rules"
          :key="rule.text"
        >
          <span
            class="ab-rules__ic"
            :class="rule.tone"
          ><component
            :is="rule.icon"
            class="size-4"
          /></span>
          {{ rule.text }}
        </li>
      </ul>
    </section>

    <section class="ab-card">
      <h2 class="ab-title">
        {{ t.whyTitle }}
      </h2>
      <p class="ab-text">
        {{ t.whyBody }}
      </p>
    </section>

    <section class="ab-card">
      <h2 class="ab-title">
        {{ t.history }}
      </h2>
      <p
        v-if="!loading && history.length === 0"
        class="ab-muted"
      >
        {{ t.historyEmpty }}
      </p>
      <ul class="ab-history">
        <li
          v-for="row in history"
          :key="row.id"
        >
          <span class="ab-history__main">
            <span class="ab-history__label">{{ row.label }}</span>
            <span class="ab-muted">{{ row.when }}</span>
          </span>
          <span
            class="ab-history__sum"
            :class="{ 'is-credit': row.amount_som > 0 }"
          >{{ row.sum }}</span>
        </li>
      </ul>
    </section>

    <div class="ab-bar">
      <p
        v-if="!canTopup"
        class="ab-muted"
      >
        {{ t.disabled }}
      </p>
      <template v-else>
        <span class="ab-bar__sum">{{ som(amount) }}</span>
        <button
          type="button"
          class="ab-bar__btn"
          @click="topup"
        >
          {{ t.topup }}
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.ab { padding-bottom: 150px; }
.ab-card { margin: 0 12px 10px; padding: 16px; border-radius: 20px; background: var(--card); }
.ab-balance { margin: 0; font-size: 28px; font-weight: 600; letter-spacing: -0.02em; }
.ab-muted { margin: 2px 0 0; font-size: 12.5px; color: var(--muted-foreground); }
.ab-label { margin: 16px 0 0; font-size: 14px; font-weight: 600; }
.ab-amount { margin: 8px 0 0; display: flex; align-items: center; min-height: 46px; padding: 0 14px; border-radius: 14px; background: var(--background); font-size: 16px; font-weight: 500; }
.ab-chips { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-top: 8px; }
.ab-chip {
  min-height: 38px; border: 1px solid var(--border); border-radius: 12px; background: var(--card);
  color: var(--foreground); font-family: inherit; font-size: 13px; font-weight: 600; cursor: pointer;
}
.ab-chip.is-on { border-color: var(--foreground); background: var(--foreground); color: var(--background); }
.ab-chip:focus-visible, .ab-bar__btn:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
.ab-hint { margin: 8px 0 0; font-size: 12.5px; font-weight: 500; }
.ab-rules { display: flex; flex-direction: column; gap: 12px; margin: 16px 0 0; padding: 0; list-style: none; }
.ab-rules li { display: flex; align-items: flex-start; gap: 10px; font-size: 13.5px; line-height: 1.45; }
.ab-rules__ic { flex-shrink: 0; display: grid; place-items: center; width: 28px; height: 28px; border-radius: 9px; color: #fff; }
.ab-rules__ic.is-blue { background: #5b6cf0; }
.ab-rules__ic.is-amber { background: #d99a00; }
.ab-rules__ic.is-green { background: var(--success); }
.ab-title { margin: 0; font-size: 15px; font-weight: 600; }
.ab-text { margin: 6px 0 0; font-size: 13.5px; line-height: 1.5; color: var(--muted-foreground); }
.ab-history { margin: 4px 0 0; padding: 0; list-style: none; }
.ab-history li { display: flex; align-items: center; gap: 10px; min-height: 52px; }
.ab-history li + li { border-top: 1px solid var(--border); }
.ab-history__main { display: flex; flex: 1; min-width: 0; flex-direction: column; }
.ab-history__label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13.5px; font-weight: 500; }
.ab-history__sum { flex-shrink: 0; font-size: 13.5px; font-weight: 700; }
.ab-history__sum.is-credit { color: var(--success); }
.ab-bar {
  /* Runs down behind the agent footer (z-40 on top), so no gap can open between them. */
  position: fixed; inset-inline: 0; bottom: 0; z-index: 30;
  display: flex; align-items: center; gap: 12px; margin: 0 auto; max-width: 32rem;
  padding: 12px 16px calc(max(env(safe-area-inset-bottom), 8px) + 72px);
  border-radius: 20px 20px 0 0; background: var(--card); box-shadow: 0 -10px 24px -14px rgba(9, 40, 78, 0.25);
}
.ab-bar__sum { flex: 1; font-size: 17px; font-weight: 600; }
.ab-bar__btn {
  min-height: 46px; padding: 0 18px; border: 0; border-radius: 14px; background: var(--foreground); color: var(--background);
  font-family: inherit; font-size: 14.5px; font-weight: 600; cursor: pointer;
}
</style>
