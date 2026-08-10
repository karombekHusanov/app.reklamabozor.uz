<script setup lang="ts">
import { Clock, Eye, MessageSquareQuote } from '@lucide/vue'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import GlassCard from '@/core/ui/GlassCard.vue'
import Badge from '@/core/ui/Badge.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { categoryName } from '@/core/i18n/category-name'
import { offerStatusVariant } from '@/modules/orders/lib/order-status'
import { ROUTES } from '@/modules/shell/constants/routes'
import type { AgentOrder } from '@/modules/orders/types/order'

const locale = useLocaleStore()
const router = useRouter()

const props = defineProps<{
  order: AgentOrder
  /** Deep-link focus — highlight this card once scrolled into view. */
  highlight?: boolean
}>()

const orderTitle = computed(() =>
  props.order.title
  || (props.order.category ? categoryName(props.order.category, locale.locale) : ''),
)

const deadlineLabel = computed(() => {
  if (props.order.deadline === 'this_week') return locale.t.orders.deadlineThisWeek
  if (props.order.deadline === 'today_tomorrow') return locale.t.orders.deadlineTodayTomorrow
  return null
})

function openDetail() {
  router.push(ROUTES.offerOpportunity(props.order.id))
}
</script>

<template>
  <GlassCard
    :id="`agent-order-${order.id}`"
    interactive
    class="scroll-mt-20 space-y-3 transition-shadow"
    :class="highlight && 'ring-2 ring-primary/50'"
    @click="openDetail"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="truncate font-semibold leading-tight">
          {{ orderTitle }}
        </p>
        <p
          v-if="order.client.first_name"
          class="text-xs text-muted-foreground"
        >
          {{ locale.t.agent.fromLabel }}: {{ order.client.first_name }}
        </p>
      </div>
      <Badge
        v-if="order.my_offer"
        :variant="offerStatusVariant(order.my_offer.status)"
        class="shrink-0"
      >
        {{ locale.t.orders.offerStatus[order.my_offer.status] }}
      </Badge>
    </div>

    <p class="line-clamp-3 text-sm text-muted-foreground">
      {{ order.description }}
    </p>

    <div class="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
      <span
        v-if="deadlineLabel"
        class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 font-medium text-primary"
      >
        <Clock class="size-3.5" />
        {{ deadlineLabel }}
      </span>
      <span class="inline-flex items-center gap-1.5">
        <Eye class="size-3.5" />
        {{ order.views_count ?? 0 }} {{ locale.t.orders.viewsSuffix }}
      </span>
      <span class="inline-flex items-center gap-1.5">
        <MessageSquareQuote class="size-3.5" />
        {{ order.offers_count ?? 0 }} {{ locale.t.orders.offersSuffix }}
      </span>
    </div>
  </GlassCard>
</template>
