<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { Loader2, Ticket, Wallet } from '@lucide/vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import { useRouter } from 'vue-router'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { ROUTES } from '@/modules/shell/constants/routes'
import { formatDateTime } from '@/core/lib/date'
import { fmtSom, passStrings } from '@/modules/agent/lib/pass-i18n'
import { usePassCountdown } from '@/modules/agent/composables/usePassCountdown'
import { usePassStore } from '@/modules/agent/stores/pass.store'

withDefaults(defineProps<{ showHistory?: boolean }>(), { showHistory: false })

const locale = useLocaleStore()
const router = useRouter()

/** Per-otklik mode tops the balance up; wallet mode pays from the balance; otherwise the card page. */
function checkout() {
  if (perResponse.value) {
    void router.push({ path: ROUTES.propuskPay, query: { topup: '1' } })
    return
  }
  if (store.walletEnabled) {
    void store.buy()
    return
  }
  store.openCardCheckout()
  void router.push(ROUTES.propuskPay)
}
const store = usePassStore()
const { pass, history, buying, isActive, enforce, loaded, perResponse, balanceSom } = storeToRefs(store)
const { hours, minutes } = usePassCountdown()

const t = computed(() => passStrings(locale.locale))

const timeLeft = computed(() =>
  t.value.timeLeft.replace('{h}', String(hours.value)).replace('{m}', String(minutes.value)),
)
const priceLabel = computed(() => fmtSom(pass.value?.price_som ?? 0, t.value.unit))
const feeSom = computed(() => pass.value?.response_price_som ?? 0)
const feeLabel = computed(() => t.value.perOtklik.replace('{price}', fmtSom(feeSom.value, t.value.unit)))
const otkliksLeft = computed(() => (feeSom.value > 0 ? Math.floor(balanceSom.value / feeSom.value) : 0))

const buyLabel = computed(() =>
  (isActive.value ? t.value.extend : t.value.buy)
    .replace('{price}', priceLabel.value)
    .replace('{hours}', String(pass.value?.hours ?? 24)),
)

onMounted(() => {
  void store.load()
})
</script>

<template>
  <!-- Pay-per-otklik: the balance each response is taken from -->
  <GlassCard
    v-if="loaded && pass && perResponse && enforce"
    class="space-y-3"
  >
    <p class="profile-eyebrow flex items-center gap-1.5">
      <Wallet
        class="size-3.5"
        aria-hidden="true"
      />
      {{ t.walletTitle }}
    </p>
    <div>
      <p class="rb-font-display text-[24px] font-extrabold tabular-nums leading-tight tracking-[-0.02em] text-foreground">
        {{ fmtSom(balanceSom, t.unit) }}
      </p>
      <p class="mt-1 text-[12.5px] text-muted-foreground">
        {{ feeLabel }}<template v-if="otkliksLeft > 0">
          · {{ t.otkliksLeft.replace('{count}', String(otkliksLeft)) }}
        </template>
      </p>
    </div>
    <button
      type="button"
      class="pressable flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-[14px] font-bold text-primary-foreground transition active:scale-[0.98]"
      @click="checkout"
    >
      {{ t.topup }}
    </button>
  </GlassCard>

  <GlassCard
    v-else-if="loaded && pass"
    class="space-y-3"
  >
    <div class="flex items-center justify-between gap-2">
      <p class="profile-eyebrow flex items-center gap-1.5">
        <Ticket
          class="size-3.5"
          aria-hidden="true"
        />
        {{ t.title }}
      </p>
      <span
        v-if="enforce || isActive"
        class="inline-flex h-5 items-center rounded-full px-2 text-[10.5px] font-bold"
        :style="isActive
          ? 'background: color-mix(in oklab, var(--rb-glow) 16%, transparent); color: var(--foreground)'
          : 'background: var(--secondary); color: var(--muted-foreground)'"
      >{{ isActive ? t.active : t.inactive }}</span>
    </div>

    <p
      v-if="isActive"
      class="rb-font-display text-[20px] font-extrabold tabular-nums leading-tight tracking-[-0.01em] text-foreground"
    >
      {{ timeLeft }}
    </p>
    <p
      v-else-if="!enforce"
      class="text-[13px] text-muted-foreground"
    >
      {{ t.free }}
    </p>

    <button
      v-if="enforce || isActive"
      type="button"
      class="pressable flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-[14px] font-bold text-primary-foreground transition active:scale-[0.98] disabled:opacity-60"
      :disabled="buying"
      @click="checkout"
    >
      <Loader2
        v-if="buying"
        class="size-4 animate-spin"
      />
      {{ buying ? t.buying : buyLabel }}
    </button>

    <div
      v-if="showHistory"
      class="space-y-2 pt-1"
    >
      <p class="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {{ t.history }}
      </p>
      <p
        v-if="!history.length"
        class="text-[12.5px] text-muted-foreground"
      >
        {{ t.historyEmpty }}
      </p>
      <ul
        v-else
        class="divide-y divide-border"
      >
        <li
          v-for="item in history"
          :key="item.id"
          class="flex items-center justify-between gap-3 py-2 text-[12.5px]"
        >
          <span class="min-w-0">
            <span class="block truncate font-semibold text-foreground">
              {{ formatDateTime(item.starts_at) }} → {{ formatDateTime(item.expires_at) }}
            </span>
            <span
              v-if="item.note"
              class="block truncate text-muted-foreground"
            >{{ item.note }}</span>
          </span>
          <span class="shrink-0 text-right tabular-nums text-muted-foreground">
            {{ fmtSom(item.price_som, t.unit) }}
            <span
              v-if="item.is_current"
              class="ml-1 font-bold text-foreground"
            >· {{ t.currentBadge }}</span>
          </span>
        </li>
      </ul>
    </div>
  </GlassCard>
</template>
