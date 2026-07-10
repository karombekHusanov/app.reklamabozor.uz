<script setup lang="ts">
import { ChevronRight, Eye, MessageSquareQuote } from '@lucide/vue'
import { computed } from 'vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import OrderStatusBadge from '@/modules/orders/components/OrderStatusBadge.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { categoryName } from '@/core/i18n/category-name'
import { categoryIcon } from '@/modules/orders/lib/category-icon'
import { formatShortDate } from '@/core/lib/date'
import type { Order } from '@/modules/orders/types/order'

const props = defineProps<{ order: Order }>()

defineEmits<{ open: [] }>()

const locale = useLocaleStore()

const title = computed(() =>
  props.order.category ? categoryName(props.order.category, locale.locale) : props.order.title,
)
const offersCount = computed(() => props.order.offers_count ?? props.order.offers?.length ?? 0)
</script>

<template>
  <GlassCard
    interactive
    class="space-y-3"
    @click="$emit('open')"
  >
    <div class="flex items-start gap-3">
      <span class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <component
          :is="categoryIcon(order.category)"
          class="size-5"
        />
      </span>

      <div class="min-w-0 flex-1">
        <div class="flex items-start justify-between gap-2">
          <p class="truncate font-semibold leading-tight text-foreground">
            {{ title }}
          </p>
          <OrderStatusBadge
            :status="order.status"
            class="shrink-0"
          />
        </div>
        <p class="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {{ order.description }}
        </p>
      </div>
    </div>

    <div class="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
      <div class="inline-flex items-center gap-4">
        <span class="inline-flex items-center gap-1.5">
          <Eye class="size-3.5" />
          {{ order.views_count ?? 0 }}
        </span>
        <span class="inline-flex items-center gap-1.5">
          <MessageSquareQuote class="size-3.5" />
          {{ offersCount }} {{ locale.t.orders.offersSuffix }}
        </span>
      </div>
      <span class="inline-flex items-center gap-1">
        {{ formatShortDate(order.created_at) }}
        <ChevronRight class="size-4" />
      </span>
    </div>
  </GlassCard>
</template>
