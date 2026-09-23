<script setup lang="ts">
import { computed } from 'vue'
import Badge from '@/core/ui/Badge.vue'
import OrderTile from '@/modules/orders/components/OrderTile.vue'
import { orderStatusVariant } from '@/modules/orders/lib/order-status'
import ClientProfileSectionShell from '@/modules/profile/components/client-sections/ClientProfileSectionShell.vue'
import { ROUTES } from '@/modules/shell/constants/routes'
import type { Order } from '@/modules/orders/types/order'

const props = defineProps<{
  locale: any
  orders: Order[]
}>()

const emit = defineEmits<{
  navigate: [to: string]
  openOrder: [id: number]
}>()

const recentOrders = computed(() => props.orders.slice(0, 3))

function viewAll() {
  emit('navigate', ROUTES.orders)
}
</script>

<template>
  <ClientProfileSectionShell
    :title="locale.t.profile.clientOrderHistoryTitle"
    show-view-all
    @view-all="viewAll"
  >
    <div
      v-if="recentOrders.length"
      class="space-y-3"
    >
      <OrderTile
        v-for="order in recentOrders"
        :key="order.id"
        :title="order.title"
        :description="order.description"
        :category="order.category"
        :region="order.region"
        :created-at="order.created_at"
        :views-count="order.views_count"
        :offers-count="order.offers_count"
        @open="emit('openOrder', order.id)"
      >
        <template #badge>
          <Badge
            :variant="orderStatusVariant(order.status)"
            class="shrink-0 !px-2.5 !py-1 text-[11px] font-bold"
          >
            {{ locale.t.orders.status[order.status] }}
          </Badge>
        </template>
      </OrderTile>
    </div>

    <p
      v-else
      class="py-4 text-center text-[11px] text-muted-foreground"
    >
      {{ locale.t.profile.clientOrderHistoryEmpty }}
    </p>
  </ClientProfileSectionShell>
</template>
