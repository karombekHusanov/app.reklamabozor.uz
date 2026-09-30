<script setup lang="ts">
import { Loader2, Star } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import { Button } from '@/core/ui/button'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { fetchReviewCriteria } from '@/modules/orders/services/orders.service'
import type { ReviewCriterionDef, ReviewCriterionScore } from '@/modules/orders/types/order'

const props = defineProps<{
  /** The role being rated — determines which criteria catalog to fetch. */
  targetRole: 'agent' | 'designer' | 'client'
  title: string
  body: string
  submitting?: boolean
}>()

const emit = defineEmits<{
  submit: [criteria: ReviewCriterionScore[], comment: string | null]
}>()

const locale = useLocaleStore()

const criteriaDefs = ref<ReviewCriterionDef[]>([])
const scores = ref<Record<string, number>>({})
const comment = ref('')
const loading = ref(true)

const criteriaLabels = computed(() => locale.t.rating.criteria as Record<string, string>)

function criterionLabel(code: string): string {
  return criteriaLabels.value[code] ?? code
}

const ratedDefs = computed(() => criteriaDefs.value.filter(c => (scores.value[c.code] ?? 0) >= 1))

// At least one score OR a comment is enough to leave a review.
const canSubmit = computed(() => ratedDefs.value.length > 0 || comment.value.trim().length > 0)

// Weighted average over the criteria the user actually rated.
const previewScore = computed(() => {
  let sum = 0
  let wSum = 0
  for (const c of ratedDefs.value) {
    sum += c.weight * scores.value[c.code]
    wSum += c.weight
  }
  return wSum > 0 ? (sum / wSum).toFixed(1) : null
})

onMounted(async () => {
  try {
    criteriaDefs.value = await fetchReviewCriteria(props.targetRole)
    for (const c of criteriaDefs.value) {
      scores.value[c.code] = 0
    }
  }
  catch {
    criteriaDefs.value = []
  }
  finally {
    loading.value = false
  }
})

// Tapping the current score again clears it (rating is optional per criterion).
function setScore(code: string, value: number) {
  scores.value[code] = scores.value[code] === value ? 0 : value
}

function handleSubmit() {
  if (!canSubmit.value) return
  const criteria: ReviewCriterionScore[] = ratedDefs.value.map(c => ({
    code: c.code,
    score: scores.value[c.code],
  }))
  emit('submit', criteria, comment.value.trim() || null)
}
</script>

<template>
  <GlassCard class="mt-6 space-y-3">
    <h3 class="text-base font-semibold">
      {{ title }}
    </h3>
    <p class="text-sm text-muted-foreground">
      {{ body }}
    </p>

    <div v-if="loading" class="flex justify-center py-4">
      <Loader2 class="size-5 animate-spin text-muted-foreground" />
    </div>

    <template v-else-if="criteriaDefs.length > 0">
      <div class="space-y-3">
        <div
          v-for="criterion in criteriaDefs"
          :key="criterion.code"
          class="space-y-1"
        >
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-foreground">
              {{ criterionLabel(criterion.code) }}
            </span>
            <span
              v-if="scores[criterion.code]"
              class="text-xs font-semibold tabular-nums text-amber-500"
            >
              {{ scores[criterion.code] }}/5
            </span>
          </div>
          <div class="flex gap-1.5">
            <button
              v-for="star in 5"
              :key="star"
              type="button"
              class="p-0.5"
              @click="setScore(criterion.code, star)"
            >
              <Star
                class="size-6 transition-colors"
                :class="star <= (scores[criterion.code] ?? 0) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'"
              />
            </button>
          </div>
        </div>
      </div>

      <div
        v-if="previewScore"
        class="flex items-center justify-center gap-2 rounded-2xl bg-primary/8 px-4 py-2.5"
      >
        <Star class="size-5 fill-amber-400 text-amber-400" />
        <span class="text-sm font-bold text-foreground">{{ previewScore }}</span>
        <span class="text-xs text-muted-foreground">/5</span>
      </div>

      <textarea
        v-model="comment"
        rows="2"
        :placeholder="locale.t.orders.rateCommentPlaceholder"
        class="glass-input resize-none"
      />

      <Button
        class="h-11 w-full rounded-2xl"
        :disabled="!canSubmit || submitting"
        @click="handleSubmit"
      >
        <Loader2
          v-if="submitting"
          class="size-4 animate-spin"
        />
        {{ locale.t.orders.rateSubmit }}
      </Button>
    </template>
  </GlassCard>
</template>
