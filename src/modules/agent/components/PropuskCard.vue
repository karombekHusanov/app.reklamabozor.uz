<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { Wallet } from '@lucide/vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import { useRouter } from 'vue-router'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { ROUTES } from '@/modules/shell/constants/routes'
import { fmtSom, passStrings } from '@/modules/agent/lib/pass-i18n'
import { usePassStore } from '@/modules/agent/stores/pass.store'

/** The balance every per-order fee (otklik / taking a Tezkor job) is taken from. */
const locale = useLocaleStore()
const router = useRouter()
const store = usePassStore()
const { pass, loaded, feesOn, balanceSom, feeSom } = storeToRefs(store)

const t = computed(() => passStrings(locale.locale))
const feeLabel = computed(() => t.value.perOtklik.replace('{price}', fmtSom(feeSom.value, t.value.unit)))
const ordersLeft = computed(() => (feeSom.value > 0 ? Math.floor(balanceSom.value / feeSom.value) : 0))

function topup() {
  void router.push({ path: ROUTES.propuskPay, query: { topup: '1' } })
}

onMounted(() => {
  void store.load()
})
</script>

<template>
  <GlassCard
    v-if="loaded && pass && feesOn"
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
        {{ feeLabel }}<template v-if="ordersLeft > 0">
          · {{ t.otkliksLeft.replace('{count}', String(ordersLeft)) }}
        </template>
      </p>
    </div>
    <button
      type="button"
      class="pressable flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-[14px] font-bold text-primary-foreground transition active:scale-[0.98]"
      @click="topup"
    >
      {{ t.topup }}
    </button>
  </GlassCard>

  <GlassCard
    v-else-if="loaded && pass"
    class="space-y-1"
  >
    <p class="profile-eyebrow flex items-center gap-1.5">
      <Wallet
        class="size-3.5"
        aria-hidden="true"
      />
      {{ t.walletTitle }}
    </p>
    <p class="text-[13px] text-muted-foreground">
      {{ t.free }}
    </p>
  </GlassCard>
</template>
