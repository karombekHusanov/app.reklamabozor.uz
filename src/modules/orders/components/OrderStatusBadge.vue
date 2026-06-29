<script setup lang="ts">
import Badge from '@/core/ui/Badge.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { orderStatusVariant } from '@/modules/orders/lib/order-status'
import type { OrderStatus } from '@/modules/orders/types/order'

defineProps<{ status: OrderStatus }>()

const locale = useLocaleStore()
</script>

<template>
  <Badge :variant="orderStatusVariant(status)">
    {{ locale.t.orders.status[status] }}
  </Badge>
</template>
