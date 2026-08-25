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
      <span class="live-order-tile__badge">
        {{ locale.t.home.liveOrdersRequestBadge }}
      </span>
    </template>
  </OrderTile>
</template>
