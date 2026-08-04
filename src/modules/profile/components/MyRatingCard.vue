<script setup lang="ts">
import { Star, TrendingUp } from '@lucide/vue'
import { onMounted, ref } from 'vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { fetchMyRating } from '@/modules/orders/services/orders.service'
import type { RatingInfo } from '@/modules/orders/types/order'

const props = defineProps<{
  role?: string
}>()

const locale = useLocaleStore()

const rating = ref<RatingInfo | null>(null)
const loaded = ref(false)

const gradeColor = (grade: number) => {
  if (grade >= 80) return 'text-emerald-600 dark:text-emerald-400'
  if (grade >= 60) return 'text-primary'
  if (grade >= 40) return 'text-amber-600 dark:text-amber-400'
  return 'text-destructive'
}

onMounted(async () => {
  try {
    rating.value = await fetchMyRating(props.role)
  }
  catch {
    rating.value = null
  }
  finally {
    loaded.value = true
  }
})
</script>

<template>
  <GlassCard
    v-if="loaded && rating"
    class="space-y-2"
  >
    <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {{ locale.t.rating.myRating }}
    </p>

    <div class="flex items-center gap-4">
      <div class="flex items-center gap-1.5">
        <Star class="size-5 fill-amber-400 text-amber-400" />
        <span class="text-lg font-bold tabular-nums text-foreground">
          {{ rating.stars.toFixed(1) }}
        </span>
        <span class="text-xs text-muted-foreground">
          {{ locale.t.rating.starsCount.replace('{count}', String(rating.stars_count)) }}
        </span>
      </div>

      <div class="h-6 w-px bg-border" />

      <div class="flex items-center gap-1.5">
        <TrendingUp class="size-4" :class="gradeColor(rating.grade)" />
        <span class="text-lg font-bold tabular-nums" :class="gradeColor(rating.grade)">
          {{ rating.grade }}
        </span>
        <span
          v-if="rating.grade_label"
          class="text-xs text-muted-foreground"
        >
          {{ rating.grade_label }}
        </span>
      </div>
    </div>
  </GlassCard>
</template>
