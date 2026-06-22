<script setup lang="ts">
import Badge from '@/core/ui/Badge.vue'
import { orderStatusLabel, orderStatusVariant } from '@/modules/orders/lib/order-status'
import type { OrderStatus } from '@/modules/orders/types/order'

defineProps<{ status: OrderStatus }>()
</script>

<template>
  <Badge :variant="orderStatusVariant(status)">
    {{ orderStatusLabel(status) }}
  </Badge>
</template>
