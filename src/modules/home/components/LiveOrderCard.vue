<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { categoryName } from '@/core/i18n/category-name'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { ROUTES } from '@/modules/shell/constants/routes'
import OrderPreviewCard from '@/modules/orders/components/OrderPreviewCard.vue'
import type { LiveOrder } from '@/modules/home/services/live-orders.service'

const props = defineProps<{
  order: LiveOrder
}>()

const locale = useLocaleStore()
const router = useRouter()

const title = computed(() =>
  props.order.title
  || (props.order.category ? categoryName(props.order.category, locale.locale) : ''),
)

const categoryLabel = computed(() =>
  props.order.category ? categoryName(props.order.category, locale.locale) : null,
)

function openDetail() {
  router.push(ROUTES.liveOrderDetail(props.order.id))
}

function openClient() {
  if (!props.order.client) return
  router.push(ROUTES.clientDetail(props.order.client.id))
}
</script>

<template>
  <OrderPreviewCard
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
  />
</template>
