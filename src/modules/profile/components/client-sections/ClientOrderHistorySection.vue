<script setup lang="ts">
import { computed } from 'vue'
import ClientOrderHistoryItem from '@/modules/profile/components/client-sections/ClientOrderHistoryItem.vue'
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

function acceptedPrice(order: Order): string | null {
  const accepted = order.offers?.find(offer => offer.status === 'accepted')
  return accepted ? String(accepted.price) : null
}

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
    <div v-if="recentOrders.length" class="space-y-2">
      <ClientOrderHistoryItem
        v-for="order in recentOrders"
        :key="order.id"
        :order="order"
        :price="acceptedPrice(order)"
        @open="emit('openOrder', order.id)"
      />
    </div>

    <p v-else class="py-4 text-center text-[11px] text-muted-foreground">
      {{ locale.t.profile.clientOrderHistoryEmpty }}
    </p>
  </ClientProfileSectionShell>
</template>
