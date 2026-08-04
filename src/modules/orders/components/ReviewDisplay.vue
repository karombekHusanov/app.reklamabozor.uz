<script setup lang="ts">
import { Clock, Star } from '@lucide/vue'
import { computed } from 'vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import Badge from '@/core/ui/Badge.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import type { OrderReview } from '@/modules/orders/types/order'

const props = defineProps<{
  review: OrderReview
  label: string
}>()

const locale = useLocaleStore()

const criteriaLabels = computed(() => locale.t.rating.criteria as Record<string, string>)

function criterionLabel(code: string): string {
  return criteriaLabels.value[code] ?? code
}

const isPending = computed(() => props.review.status === 'pending')
</script>

<template>
  <GlassCard class="space-y-2.5">
    <div class="flex items-center justify-between gap-2">
      <p class="text-sm font-semibold text-foreground">
        {{ label }}
      </p>
      <Badge v-if="isPending" variant="warning" class="gap-1 text-[10px]">
        <Clock class="size-3" />
        {{ locale.t.orders.ratePending }}
      </Badge>
    </div>

    <div class="flex items-center gap-2">
      <div class="flex">
        <Star
          v-for="n in 5"
          :key="n"
          class="size-4"
          :class="n <= Math.round(review.rating) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'"
        />
      </div>
      <span class="text-sm font-bold tabular-nums text-foreground">
        {{ review.rating.toFixed(1) }}
      </span>
    </div>

    <div
      v-if="review.criteria?.length"
      class="space-y-1.5"
    >
      <div
        v-for="c in review.criteria"
        :key="c.code"
        class="flex items-center justify-between text-xs"
      >
        <span class="text-muted-foreground">{{ criterionLabel(c.code) }}</span>
        <div class="flex items-center gap-1">
          <div class="flex">
            <Star
              v-for="n in 5"
              :key="n"
              class="size-3"
              :class="n <= c.score ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/20'"
            />
          </div>
        </div>
      </div>
    </div>

    <p
      v-if="review.comment"
      class="text-sm text-muted-foreground"
    >
      {{ review.comment }}
    </p>
  </GlassCard>
</template>
