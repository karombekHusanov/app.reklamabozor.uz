<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { RefreshCw, Wallet } from '@lucide/vue'
import Drawer from '@/core/ui/Drawer.vue'
import { useRouter } from 'vue-router'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { ROUTES } from '@/modules/shell/constants/routes'
import { fmtSom, passStrings } from '@/modules/agent/lib/pass-i18n'
import { usePassStore } from '@/modules/agent/stores/pass.store'

/** Balance below the per-order fee: pick an amount, top up by card, then the blocked action resends. */
const locale = useLocaleStore()
const router = useRouter()

function checkout() {
  store.openCardCheckout()
  void router.push({ path: ROUTES.propuskPay, query: { topup: '1', amount: String(topupSom.value) } })
}
const store = usePassStore()
const { pass, drawerOpen, neededSom, balanceSom } = storeToRefs(store)
const t = computed(() => passStrings(locale.locale))

const open = computed({
  get: () => drawerOpen.value,
  set: (v: boolean) => { if (!v) store.closeDrawer() },
})

const feeSom = computed(() => neededSom.value ?? pass.value?.response_price_som ?? 1000)

/** Quick amounts right in the sheet — the pick carries over to the card page. */
const topupOptions = computed(() => [5000, 10000, 20000].filter(v => v >= feeSom.value))
const topupSom = ref(10000)
watch(drawerOpen, (v) => { if (v) topupSom.value = topupOptions.value.includes(10000) ? 10000 : (topupOptions.value[0] ?? feeSom.value) })
</script>

<template>
  <Drawer
    v-model:open="open"
    :title="t.balanceDrawerTitle"
  >
    <div class="bd">
      <!-- price vs balance — the two numbers that explain the sheet -->
      <div class="bd__stats">
        <div class="bd__stat">
          <span class="bd__stat-l">{{ t.otklikPrice }}</span>
          <span class="bd__stat-v">{{ fmtSom(feeSom, t.unit) }}</span>
        </div>
        <div class="bd__stat bd__stat--low">
          <span class="bd__stat-l">{{ t.walletTitle }}</span>
          <span class="bd__stat-v">{{ fmtSom(balanceSom, t.unit) }}</span>
        </div>
      </div>

      <p class="bd__label">
        {{ t.topupAmount }}
      </p>
      <div class="bd__amounts">
        <button
          v-for="v in topupOptions"
          :key="v"
          type="button"
          class="bd__amount"
          :class="{ 'is-on': topupSom === v }"
          :aria-pressed="topupSom === v"
          @click="topupSom = v"
        >
          <span class="bd__amount-v">{{ fmtSom(v, t.unit) }}</span>
          <span class="bd__amount-s">{{ t.otklikCount.replace('{count}', String(Math.floor(v / feeSom))) }}</span>
        </button>
      </div>

      <p class="bd__hint">
        <RefreshCw
          class="size-3.5 shrink-0"
          aria-hidden="true"
        />
        {{ t.balanceDrawerHint }}
      </p>

      <button
        type="button"
        class="bd__cta"
        @click="checkout"
      >
        <Wallet
          class="size-[18px]"
          aria-hidden="true"
        />
        {{ t.topupCta.replace('{amount}', fmtSom(topupSom, t.unit)) }}
      </button>
    </div>

  </Drawer>
</template>

<style scoped>
.bd { display: flex; flex-direction: column; gap: 14px; padding: 2px 2px 4px; }

.bd__stats { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.bd__stat { display: flex; flex-direction: column; gap: 3px; padding: 12px 14px; border-radius: 16px; background: var(--secondary); }
.bd__stat-l { font-size: 11.5px; font-weight: 700; color: var(--muted-foreground); }
.bd__stat-v { font-family: var(--rb-font-display); font-size: 19px; font-weight: 900; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; color: var(--foreground); }
.bd__stat--low { background: color-mix(in srgb, var(--destructive) 9%, var(--card)); }
.bd__stat--low .bd__stat-v { color: var(--destructive); }

.bd__label { margin: 2px 0 -4px; font-size: 12.5px; font-weight: 700; color: var(--muted-foreground); }
.bd__amounts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.bd__amount {
  display: flex; flex-direction: column; align-items: center; gap: 1px; min-height: 56px; padding: 8px 4px;
  border: 1.5px solid var(--border); border-radius: 14px; background: var(--card); cursor: pointer;
  transition: border-color var(--rb-dur) var(--rb-ease), background var(--rb-dur) var(--rb-ease), transform var(--rb-dur) var(--rb-ease);
  -webkit-tap-highlight-color: transparent;
}
.bd__amount:active { transform: scale(0.97); }
.bd__amount.is-on { border-color: var(--primary); background: color-mix(in srgb, var(--primary) 8%, var(--card)); }
.bd__amount:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
.bd__amount-v { font-family: var(--rb-font-display); font-size: 14.5px; font-weight: 800; font-variant-numeric: tabular-nums; color: var(--foreground); white-space: nowrap; }
.bd__amount-s { font-size: 11px; font-weight: 600; color: var(--muted-foreground); }

.bd__hint { display: flex; align-items: center; gap: 7px; margin: 0; font-size: 12.5px; color: var(--muted-foreground); }

.bd__cta {
  display: flex; align-items: center; justify-content: center; gap: 8px; min-height: 52px; border: 0; border-radius: var(--rb-r-field);
  color: #fff; background: linear-gradient(150deg, var(--primary) 0%, var(--brand-600) 100%);
  box-shadow: 0 12px 24px -12px color-mix(in srgb, var(--primary) 70%, transparent);
  font-family: var(--rb-font-display); font-size: 15px; font-weight: 800; cursor: pointer;
  transition: transform var(--rb-dur) var(--rb-ease);
}
.bd__cta:active { transform: scale(0.98); }
.bd__cta:focus-visible { outline: 2px solid var(--primary); outline-offset: 3px; }
</style>
