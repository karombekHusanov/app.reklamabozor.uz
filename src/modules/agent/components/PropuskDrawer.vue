<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { Loader2, Ticket } from '@lucide/vue'
import Drawer from '@/core/ui/Drawer.vue'
import { useRouter } from 'vue-router'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { ROUTES } from '@/modules/shell/constants/routes'
import { fmtSom, passStrings } from '@/modules/agent/lib/pass-i18n'
import { usePassStore } from '@/modules/agent/stores/pass.store'

const locale = useLocaleStore()
const router = useRouter()

/** Wallet mode pays from the balance; otherwise open the in-app card page. */
function checkout() {
  if (store.walletEnabled) {
    void store.buy()
    return
  }
  store.openCardCheckout()
  void router.push(ROUTES.propuskPay)
}
const store = usePassStore()
const { pass, drawerOpen, buying, awaitingPayment } = storeToRefs(store)
const t = computed(() => passStrings(locale.locale))

const open = computed({
  get: () => drawerOpen.value,
  set: (v: boolean) => { if (!v) store.closeDrawer() },
})
const price = computed(() => fmtSom(pass.value?.price_som ?? 0, t.value.unit))
</script>

<template>
  <Drawer
    v-model:open="open"
    :title="t.drawerTitle"
  >
    <div class="space-y-4 pb-2">
      <div class="flex items-start gap-3">
        <span
          class="flex size-11 shrink-0 items-center justify-center rounded-2xl"
          style="background: color-mix(in oklab, var(--rb-glow) 16%, transparent); color: var(--foreground)"
        >
          <Ticket
            class="size-5"
            aria-hidden="true"
          />
        </span>
        <div class="space-y-1">
          <p class="text-[14px] leading-snug text-foreground">
            {{ t.drawerBody.replace('{hours}', String(pass?.hours ?? 24)) }}
          </p>
          <p class="text-[12.5px] text-muted-foreground">
            {{ t.drawerHint }}
          </p>
        </div>
      </div>

      <button
        type="button"
        class="pressable flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-[15px] font-bold text-primary-foreground transition active:scale-[0.98] disabled:opacity-60"
        :disabled="buying || awaitingPayment"
        @click="checkout"
      >
        <Loader2
          v-if="buying || awaitingPayment"
          class="size-4 animate-spin"
        />
        {{ awaitingPayment ? t.drawerChecking : t.drawerBuy.replace('{price}', price) }}
      </button>

      <button
        v-if="awaitingPayment"
        type="button"
        class="pressable h-11 w-full rounded-2xl border border-border bg-card text-[13.5px] font-semibold text-foreground"
        @click="store.refreshNow()"
      >
        {{ t.drawerRetryHint }}
      </button>
    </div>
  </Drawer>
</template>
