<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { HTMLAttributes } from 'vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { ROUTES } from '@/modules/shell/constants/routes'
import OrderTile from '@/modules/orders/components/OrderTile.vue'
import type { LiveOrder } from '@/modules/home/services/live-orders.service'

const props = defineProps<{
  order: LiveOrder
  class?: HTMLAttributes['class']
}>()

const locale = useLocaleStore()
const router = useRouter()

function openDetail() {
  router.push(ROUTES.liveOrderDetail(props.order.id))
}

function openClient() {
  if (!props.order.client) return
  router.push(ROUTES.clientDetail(props.order.client.id))
}
</script>

<template>
  <OrderTile
    :title="order.title"
    :description="order.description"
    :category="order.category"
    :region="order.region"
    :created-at="order.created_at"
    :views-count="order.views_count"
    :offers-count="order.offers_count"
    :client="order.client"
    :class="props.class"
    @open="openDetail"
    @open-client="openClient"
  >
    <template #badge>
      <span
        v-if="order.route === 'tezkor' && order.claimed_by_me"
        class="live-order-tile__badge claim-badge claim-badge--mine"
      >{{ locale.t.route.mine }}</span>
      <span
        v-else-if="order.route === 'tezkor' && order.claimed"
        class="live-order-tile__badge claim-badge"
      >{{ locale.t.route.busy }}</span>
      <span
        v-else
        class="live-order-tile__badge"
      >
        {{ locale.t.home.liveOrdersRequestBadge }}
      </span>
    </template>
  </OrderTile>
</template>

<style scoped>
.claim-badge { background: var(--secondary); color: var(--muted-foreground); }
.claim-badge--mine { background: color-mix(in srgb, var(--rb-glow) 16%, var(--card)); color: var(--foreground); }
</style>
