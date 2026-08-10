<script setup lang="ts">
import { Clock } from '@lucide/vue'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import GlassCard from '@/core/ui/GlassCard.vue'
import Badge from '@/core/ui/Badge.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { categoryName } from '@/core/i18n/category-name'
import { formatPrice, isInterestOffer, offerStatusVariant, orderStatusVariant } from '@/modules/orders/lib/order-status'
import { ROUTES } from '@/modules/shell/constants/routes'
import type { AgentOffer } from '@/modules/orders/types/order'

const locale = useLocaleStore()
const router = useRouter()

const props = defineProps<{
  offer: AgentOffer
  /** Deep-link focus — highlight this offer once scrolled into view. */
  highlight?: boolean
}>()

const orderStatus = computed(() => props.offer.order.status)

const title = computed(() =>
  props.offer.order.title
  || (props.offer.order.category
    ? categoryName(props.offer.order.category, locale.locale)
    : `#${props.offer.order.id}`),
)

// The badge tracks the deal's lifecycle once accepted; before that (pending /
// rejected) the offer's own status is what matters to the agent.
const badge = computed(() => {
  if (props.offer.status === 'accepted' && orderStatus.value) {
    return {
      variant: orderStatusVariant(orderStatus.value),
      label: locale.t.orders.status[orderStatus.value],
    }
  }
  return {
    variant: offerStatusVariant(props.offer.status),
    label: locale.t.orders.offerStatus[props.offer.status],
  }
})

const statusNote = computed(() => {
  if (props.offer.status === 'pending') return locale.t.agent.offerPendingNote
  if (props.offer.status === 'rejected') return locale.t.agent.offerRejectedNote
  if (orderStatus.value === 'awaiting_payment') return locale.t.agent.dealAwaitingPayment
  if (props.offer.status === 'accepted' && orderStatus.value === 'cancelled') {
    return locale.t.agent.dealCancelledBeforePay
  }
  if (orderStatus.value === 'work_submitted') return locale.t.agent.workAwaitingClient
  if (orderStatus.value === 'completed') return locale.t.agent.offerCompletedNote
  return null
})

const interest = computed(() => isInterestOffer(props.offer))

function openDetail() {
  router.push(ROUTES.offerDetail(props.offer.id))
}
</script>

<template>
  <GlassCard
    :id="`agent-offer-${offer.order.id}`"
    interactive
    class="scroll-mt-20 space-y-3"
    :class="highlight && 'ring-2 ring-primary/50'"
    @click="openDetail"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="truncate font-semibold leading-tight">
          {{ title }}
        </p>
        <p class="text-xs text-muted-foreground">
          <template v-if="interest">
            #{{ offer.order.id }} · {{ locale.t.orders.interestBadge }}
          </template>
          <template v-else>
            #{{ offer.order.id }} · {{ locale.t.agent.yourOffer }} {{ formatPrice(offer.price) }}
          </template>
        </p>
      </div>
      <Badge
        :variant="badge.variant"
        class="shrink-0"
      >
        {{ badge.label }}
      </Badge>
    </div>

    <p
      v-if="statusNote"
      class="inline-flex items-start gap-1.5 text-sm text-muted-foreground"
    >
      <Clock
        v-if="offer.status === 'pending'"
        class="mt-0.5 size-4 shrink-0"
      />
      <span class="line-clamp-2">{{ statusNote }}</span>
    </p>
  </GlassCard>
</template>
