<script setup lang="ts">
import { CheckCircle2, Clock, Loader2, MessageCircle } from '@lucide/vue'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import GlassCard from '@/core/ui/GlassCard.vue'
import Badge from '@/core/ui/Badge.vue'
import { Button } from '@/core/ui/button'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { categoryName } from '@/core/i18n/category-name'
import { formatPrice, offerStatusVariant, orderStatusVariant } from '@/modules/orders/lib/order-status'
import type { AgentOffer } from '@/modules/orders/types/order'

const locale = useLocaleStore()
const router = useRouter()

const props = defineProps<{
  offer: AgentOffer
  submitting?: boolean
  /** Deep-link focus — highlight this offer once scrolled into view. */
  highlight?: boolean
}>()

const emit = defineEmits<{
  submitWork: [orderId: number]
}>()

const orderStatus = computed(() => props.offer.order.status)

const title = computed(() =>
  props.offer.order.category
    ? categoryName(props.offer.order.category, locale.locale)
    : props.offer.order.title ?? `#${props.offer.order.id}`,
)

// Accepted offers whose deal is live enough to open a chat / submit work.
const isActiveDeal = computed(() =>
  props.offer.status === 'accepted'
  && ['in_progress', 'work_submitted', 'completed'].includes(orderStatus.value ?? ''),
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
</script>

<template>
  <GlassCard
    :id="`agent-offer-${offer.order.id}`"
    class="scroll-mt-20 space-y-3"
    :class="highlight && 'ring-2 ring-primary/50'"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="truncate font-semibold leading-tight">
          {{ title }}
        </p>
        <p class="text-xs text-muted-foreground">
          #{{ offer.order.id }} · {{ locale.t.agent.yourOffer }} {{ formatPrice(offer.price) }}
        </p>
      </div>
      <Badge :variant="badge.variant" class="shrink-0">
        {{ badge.label }}
      </Badge>
    </div>

    <!-- Pending: the client hasn't decided yet. -->
    <p
      v-if="offer.status === 'pending'"
      class="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
    >
      <Clock class="size-4 shrink-0" />
      {{ locale.t.agent.offerPendingNote }}
    </p>

    <!-- Rejected: someone else won. -->
    <p
      v-else-if="offer.status === 'rejected'"
      class="text-sm text-muted-foreground"
    >
      {{ locale.t.agent.offerRejectedNote }}
    </p>

    <!-- Accepted but unpaid: no chat / actions until payment lands. -->
    <p
      v-else-if="orderStatus === 'awaiting_payment'"
      class="rounded-2xl bg-amber-500/10 px-3.5 py-3 text-sm text-amber-700 dark:text-amber-300"
    >
      {{ locale.t.agent.dealAwaitingPayment }}
    </p>

    <p
      v-else-if="orderStatus === 'work_submitted'"
      class="text-sm text-muted-foreground"
    >
      {{ locale.t.agent.workAwaitingClient }}
    </p>

    <p
      v-else-if="orderStatus === 'completed'"
      class="text-sm text-muted-foreground"
    >
      {{ locale.t.agent.offerCompletedNote }}
    </p>

    <!-- Active deal actions: submit work (in progress) + open chat. -->
    <div v-if="isActiveDeal" class="flex flex-col gap-2">
      <Button
        v-if="orderStatus === 'in_progress'"
        class="h-11 w-full rounded-2xl"
        :disabled="submitting"
        @click="emit('submitWork', offer.order.id)"
      >
        <Loader2 v-if="submitting" class="size-4 shrink-0 animate-spin" />
        <CheckCircle2 v-else class="size-4 shrink-0" />
        <span class="truncate">{{ locale.t.agent.submitWork }}</span>
      </Button>
      <Button
        variant="outline"
        class="h-11 w-full rounded-2xl"
        @click="router.push(`/chat/${offer.order.id}`)"
      >
        <MessageCircle class="size-4 shrink-0" />
        <span class="truncate">{{ locale.t.chat.openChat }}</span>
      </Button>
    </div>
  </GlassCard>
</template>
