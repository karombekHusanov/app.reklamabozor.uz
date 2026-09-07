<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { History, Send } from '@lucide/vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { useTelegram } from '@/core/composables/useTelegram'
import { formatPrice } from '@/modules/orders/lib/order-status'
import { fetchEarnings } from '@/modules/profile/services/earnings.service'
import { ROUTES } from '@/modules/shell/constants/routes'
import type { EarningsBalance } from '@/modules/profile/types/earnings'

const emit = defineEmits<{ navigate: [to: string] }>()

const locale = useLocaleStore()
const { haptic } = useTelegram()

const balance = ref<EarningsBalance | null>(null)

onMounted(async () => {
  try {
    balance.value = (await fetchEarnings()).balance
  }
  catch {
    balance.value = null
  }
})

const availableLabel = computed(() => formatPrice(balance.value?.available_som ?? 0))

/** Money already released but still moving — shown as a quiet second line. */
const pendingLabel = computed(() => {
  const pending = balance.value?.processing_som ?? 0
  if (pending <= 0) return null
  return locale.t.profile.balancePending.replace('{amount}', formatPrice(pending))
})

function go(to: string) {
  haptic('light')
  emit('navigate', to)
}
</script>

<template>
  <GlassCard class="space-y-3">
    <p class="profile-eyebrow">
      {{ locale.t.profile.balanceTitle }}
    </p>

    <div class="space-y-1">
      <p class="rb-font-display text-[26px] font-extrabold tabular-nums leading-none tracking-[-0.02em] text-foreground">
        {{ availableLabel }}
      </p>
      <p class="text-[11.5px] text-muted-foreground">
        {{ locale.t.profile.balanceAvailable }}<template v-if="pendingLabel">
          · {{ pendingLabel }}
        </template>
      </p>
    </div>

    <div class="flex gap-2">
      <button
        type="button"
        class="pressable flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary text-[14px] font-bold text-primary-foreground transition active:scale-[0.98]"
        @click="go(ROUTES.earnings)"
      >
        <Send class="size-4" />
        {{ locale.t.profile.balanceRequest }}
      </button>
      <button
        type="button"
        class="pressable flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 text-[14px] font-semibold text-foreground transition active:scale-[0.98]"
        @click="go(ROUTES.earnings)"
      >
        <History class="size-4" />
        {{ locale.t.profile.balanceHistory }}
      </button>
    </div>

    <p class="text-[11.5px] leading-snug text-muted-foreground">
      {{ locale.t.profile.balanceRequestHint }}
    </p>
  </GlassCard>
</template>
