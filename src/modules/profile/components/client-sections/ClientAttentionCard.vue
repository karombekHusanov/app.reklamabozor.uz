<script setup lang="ts">
import { computed } from 'vue'
import { ChevronRight, Clock, CreditCard, PartyPopper } from '@lucide/vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { useTelegram } from '@/core/composables/useTelegram'
import { formatPrice } from '@/modules/orders/lib/order-status'
import type { Order } from '@/modules/orders/types/order'

const props = defineProps<{ order: Order }>()

const emit = defineEmits<{ open: [id: number] }>()

const locale = useLocaleStore()
const { haptic } = useTelegram()

const awaitingPayment = computed(() => props.order.status === 'awaiting_payment')

const statusLabel = computed(() => locale.t.orders.status[props.order.status])

/** The winning agency and the amount at stake — the two facts that decide. */
const meta = computed(() => {
  const accepted = props.order.offers?.find(offer => offer.status === 'accepted')
  const parts = [
    accepted?.agent?.company_name ?? null,
    props.order.payment ? formatPrice(props.order.payment.amount_som) : formatPrice(accepted?.price),
  ]

  return parts.filter(Boolean).join(' · ')
})

const actionLabel = computed(() =>
  awaitingPayment.value ? locale.t.orders.payNow : locale.t.orders.acceptWork,
)

function open() {
  haptic('light')
  emit('open', props.order.id)
}
</script>

<template>
  <GlassCard class="space-y-3 border-accent-foreground/25">
    <div class="flex items-center justify-between gap-3">
      <p class="profile-eyebrow">
        {{ locale.t.profile.attentionTitle }}
      </p>
      <span class="inline-flex h-6 items-center gap-1.5 rounded-full bg-accent px-2.5 text-[11.5px] font-bold text-accent-foreground">
        <Clock class="size-3.5" />
        {{ statusLabel }}
      </span>
    </div>

    <div>
      <p class="rb-font-display truncate text-[15px] font-extrabold tracking-[-0.01em] text-foreground">
        {{ order.title }}
      </p>
      <p
        v-if="meta"
        class="mt-1 truncate text-[12.5px] text-muted-foreground"
      >
        {{ meta }}
      </p>
    </div>

    <button
      type="button"
      class="pressable flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-[14.5px] font-bold text-primary-foreground transition active:scale-[0.98]"
      @click="open"
    >
      <CreditCard
        v-if="awaitingPayment"
        class="size-4"
      />
      <PartyPopper
        v-else
        class="size-4"
      />
      {{ actionLabel }}
      <ChevronRight class="size-4 opacity-80" />
    </button>
  </GlassCard>
</template>
