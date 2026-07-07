<script setup lang="ts">
import Badge from '@/core/ui/Badge.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { formatShortDate } from '@/core/lib/date'
import { formatPrice, orderStatusVariant } from '@/modules/orders/lib/order-status'
import type { Order } from '@/modules/orders/types/order'

const props = defineProps<{
  order: Order
  price: string | null
}>()

defineEmits<{ open: [] }>()

const locale = useLocaleStore()

const thumbnail = props.order.tz_file
</script>

<template>
  <button
    type="button"
    class="pressable agent-profile-advantage flex w-full items-center gap-3 p-2.5 text-left"
    @click="$emit('open')"
  >
    <div
      class="agent-profile-portfolio-card size-12 shrink-0 overflow-hidden rounded-xl bg-muted/40"
    >
      <img
        v-if="thumbnail"
        :src="thumbnail"
        :alt="order.title"
        class="size-full object-cover"
      >
      <div
        v-else
        class="flex size-full items-center justify-center bg-gradient-to-br from-primary/15 to-primary/5 text-xs font-bold text-primary"
      >
        {{ order.title.slice(0, 2).toUpperCase() }}
      </div>
    </div>

    <div class="min-w-0 flex-1">
      <p class="truncate text-[12px] font-bold text-foreground">
        {{ order.title }}
      </p>
      <p class="mt-0.5 text-[10px] text-muted-foreground">
        #{{ order.id }} · {{ formatShortDate(order.created_at) }}
      </p>
    </div>

    <div class="shrink-0 text-right">
      <Badge :variant="orderStatusVariant(order.status)" class="!px-2 !py-0.5 !text-[9px]">
        {{ locale.t.orders.status[order.status] }}
      </Badge>
      <p v-if="price" class="mt-1 text-[11px] font-bold text-foreground">
        {{ formatPrice(price) }}
      </p>
    </div>
  </button>
</template>
