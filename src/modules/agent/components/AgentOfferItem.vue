<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import Badge from '@/core/ui/Badge.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { categoryName } from '@/core/i18n/category-name'
import { formatPrice, isInterestOffer, offerStatusVariant, orderStatusVariant } from '@/modules/orders/lib/order-status'
import { ROUTES } from '@/modules/shell/constants/routes'
import OrderPreviewCard from '@/modules/orders/components/OrderPreviewCard.vue'
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

const categoryLabel = computed(() =>
  props.offer.order.category
    ? categoryName(props.offer.order.category, locale.locale)
    : null,
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

const interest = computed(() => isInterestOffer(props.offer))

const priceLabel = computed(() =>
  interest.value ? locale.t.orders.interestBadge : formatPrice(props.offer.price),
)

function openDetail() {
  router.push(ROUTES.offerDetail(props.offer.id))
}

function openClient() {
  const id = props.offer.order.client?.id
  if (!id) return
  router.push(ROUTES.clientDetail(id))
}
</script>

<template>
  <OrderPreviewCard
    :id="`agent-offer-${offer.order.id}`"
    :highlight="highlight"
    :client="offer.order.client"
    :created-at="offer.order.created_at ?? offer.created_at"
    :category-label="categoryLabel"
    :title="title"
    :description="offer.order.description"
    :hashtags="offer.order.hashtags"
    :views-count="offer.order.views_count"
    :offers-count="offer.order.offers_count"
    @open="openDetail"
    @open-client="openClient"
  >
    <template #chips>
      <Badge
        :variant="badge.variant"
        class="shrink-0 !px-2.5 !py-1 text-[11px] font-bold"
      >
        {{ badge.label }}
      </Badge>
      <span
        class="live-order-card__chip"
        :class="interest ? '' : 'bg-primary/12'"
      >
        {{ priceLabel }}
      </span>
    </template>
  </OrderPreviewCard>
</template>
