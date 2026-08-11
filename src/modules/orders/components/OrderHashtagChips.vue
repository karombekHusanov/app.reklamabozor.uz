<script setup lang="ts">
import { computed } from 'vue'
import type { OrderHashtag } from '@/modules/orders/types/order'

const props = withDefaults(defineProps<{
  hashtags: OrderHashtag[] | null | undefined
  /** When true, chips are tappable (emit select). */
  interactive?: boolean
  /** Single row for cards — extra tags collapse into +N. */
  compact?: boolean
  /** Visible chips in compact mode (rest become +N). */
  maxVisible?: number
}>(), {
  maxVisible: 3,
})

defineEmits<{
  select: [slug: string]
}>()

const visible = computed(() => {
  const tags = props.hashtags ?? []
  if (!props.compact) return tags
  return tags.slice(0, props.maxVisible)
})

const hiddenCount = computed(() => {
  const total = props.hashtags?.length ?? 0
  if (!props.compact) return 0
  return Math.max(0, total - visible.value.length)
})
</script>

<template>
  <div
    v-if="hashtags?.length"
    class="order-hashtags"
    :class="compact && 'order-hashtags--compact'"
  >
    <component
      :is="interactive ? 'button' : 'span'"
      v-for="tag in visible"
      :key="tag.id"
      type="button"
      class="order-hashtag"
      :class="interactive ? 'pressable cursor-pointer' : ''"
      @click="interactive && $emit('select', tag.slug)"
    >
      #{{ tag.label || tag.slug }}
    </component>
    <span
      v-if="hiddenCount"
      class="order-hashtag order-hashtag--more"
    >
      +{{ hiddenCount }}
    </span>
  </div>
</template>
