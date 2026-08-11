<script setup lang="ts">
import { computed } from 'vue'
import Badge from '@/core/ui/Badge.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { categoryName } from '@/core/i18n/category-name'
import { orderStatusVariant } from '@/modules/orders/lib/order-status'
import OrderPreviewCard from '@/modules/orders/components/OrderPreviewCard.vue'
import type { Order } from '@/modules/orders/types/order'

const props = defineProps<{ order: Order }>()

defineEmits<{ open: [] }>()

const locale = useLocaleStore()

const title = computed(() =>
  props.order.title || (props.order.category ? categoryName(props.order.category, locale.locale) : ''),
)

const categoryLabel = computed(() =>
  props.order.category ? categoryName(props.order.category, locale.locale) : null,
)

const offersCount = computed(() => props.order.offers_count ?? props.order.offers?.length ?? 0)

const deadlineLabel = computed(() => {
  if (props.order.deadline === 'this_week') return locale.t.orders.deadlineThisWeek
  if (props.order.deadline === 'today_tomorrow') return locale.t.orders.deadlineTodayTomorrow
  return null
})
</script>

<template>
  <OrderPreviewCard
    :order-id="order.id"
    :created-at="order.created_at"
    :category-label="categoryLabel"
    :title="title"
    :description="order.description"
    :hashtags="order.hashtags"
    :views-count="order.views_count"
    :offers-count="offersCount"
    @open="$emit('open')"
  >
    <template #chips>
      <span
        v-if="deadlineLabel"
        class="live-order-card__chip"
      >
        {{ deadlineLabel }}
      </span>
      <Badge
        :variant="orderStatusVariant(order.status)"
        class="shrink-0 !px-2.5 !py-1 text-[11px] font-bold"
      >
        {{ locale.t.orders.status[order.status] }}
      </Badge>
    </template>
  </OrderPreviewCard>
</template>
