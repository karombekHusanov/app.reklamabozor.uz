<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Badge from '@/core/ui/Badge.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { categoryName } from '@/core/i18n/category-name'
import { isInterestOffer, offerStatusVariant } from '@/modules/orders/lib/order-status'
import { usePassStore } from '@/modules/agent/stores/pass.store'
import { passStrings } from '@/modules/agent/lib/pass-i18n'
import { ROUTES } from '@/modules/shell/constants/routes'
import OrderPreviewCard from '@/modules/orders/components/OrderPreviewCard.vue'
import type { AgentOrder } from '@/modules/orders/types/order'

const locale = useLocaleStore()
const router = useRouter()

const props = defineProps<{
  order: AgentOrder
  /** Deep-link focus — highlight this card once scrolled into view. */
  highlight?: boolean
}>()

const title = computed(() =>
  props.order.title
  || (props.order.category ? categoryName(props.order.category, locale.locale) : ''),
)

const categoryLabel = computed(() =>
  props.order.category ? categoryName(props.order.category, locale.locale) : null,
)

const deadlineLabel = computed(() => {
  if (props.order.deadline === 'this_week') return locale.t.orders.deadlineThisWeek
  if (props.order.deadline === 'today_tomorrow') return locale.t.orders.deadlineTodayTomorrow
  return null
})

const pass = usePassStore()
const needsPassHint = computed(() =>
  pass.needsPass && props.order.route === 'tezkor' && !props.order.claimed && !props.order.my_offer,
)
onMounted(() => { void pass.ensureLoaded() })

const isTezkorClaimed = computed(() => props.order.route === 'tezkor' && Boolean(props.order.claimed))

function openDetail() {
  router.push(ROUTES.offerOpportunity(props.order.id))
}

function openClient() {
  if (!props.order.client.id) return
  router.push(ROUTES.clientDetail(props.order.client.id))
}
</script>

<template>
  <OrderPreviewCard
    :id="`agent-order-${order.id}`"
    :highlight="highlight"
    :client="order.client"
    :created-at="order.created_at"
    :category-label="categoryLabel"
    :title="title"
    :description="order.description"
    :hashtags="order.hashtags"
    :views-count="order.views_count"
    :offers-count="order.offers_count"
    @open="openDetail"
    @open-client="openClient"
  >
    <template
      v-if="deadlineLabel || order.my_offer || isTezkorClaimed"
      #chips
    >
      <span
        v-if="deadlineLabel"
        class="live-order-card__chip"
      >
        {{ deadlineLabel }}
      </span>
      <Badge
        v-if="order.route === 'tezkor' && order.claimed_by_me"
        variant="primary"
        class="shrink-0 !px-2.5 !py-1 text-[11px] font-bold"
      >
        {{ locale.t.route.mine }}
      </Badge>
      <Badge
        v-else-if="order.route === 'tezkor' && order.claimed"
        variant="default"
        class="shrink-0 !px-2.5 !py-1 text-[11px] font-bold"
      >
        {{ locale.t.route.busy }}
      </Badge>
      <Badge
        v-else-if="needsPassHint"
        variant="default"
        class="shrink-0 !px-2.5 !py-1 text-[11px] font-bold"
      >
        {{ passStrings(locale.locale).needed }}
      </Badge>
      <Badge
        v-else-if="order.my_offer"
        :variant="offerStatusVariant(order.my_offer.status)"
        class="shrink-0 !px-2.5 !py-1 text-[11px] font-bold"
      >
        {{ isInterestOffer(order.my_offer)
          ? locale.t.orders.interestBadge
          : locale.t.orders.offerStatus[order.my_offer.status] }}
      </Badge>
    </template>
  </OrderPreviewCard>
</template>
