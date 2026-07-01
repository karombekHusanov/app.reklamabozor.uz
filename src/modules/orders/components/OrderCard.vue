<script setup lang="ts">
import { ChevronRight, Eye, MessageSquareQuote } from '@lucide/vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import OrderStatusBadge from '@/modules/orders/components/OrderStatusBadge.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { categoryName } from '@/core/i18n/category-name'
import type { Order } from '@/modules/orders/types/order'

defineProps<{ order: Order }>()

defineEmits<{ open: [] }>()

const locale = useLocaleStore()
</script>

<template>
  <GlassCard interactive class="space-y-3" @click="$emit('open')">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="truncate font-semibold leading-tight">
          {{ order.category ? categoryName(order.category, locale.locale) : order.title }}
        </p>
        <p class="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {{ order.description }}
        </p>
      </div>
      <OrderStatusBadge :status="order.status" class="shrink-0" />
    </div>

    <div class="flex items-center justify-between text-xs text-muted-foreground">
      <div class="inline-flex items-center gap-4">
        <span class="inline-flex items-center gap-1.5">
          <Eye class="size-3.5" />
          {{ order.views_count ?? 0 }} {{ locale.t.orders.viewsSuffix }}
        </span>
        <span class="inline-flex items-center gap-1.5">
          <MessageSquareQuote class="size-3.5" />
          {{ order.offers_count ?? order.offers?.length ?? 0 }} {{ locale.t.orders.offersSuffix }}
        </span>
      </div>
      <ChevronRight class="size-4" />
    </div>
  </GlassCard>
</template>
