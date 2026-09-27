<script setup lang="ts">
import { cn } from '@/core/lib/utils'
import type { HTMLAttributes } from 'vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  class?: HTMLAttributes['class']
  /** Logo mark diameter. */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Render the "PRB" wordmark next to the mark. */
  wordmark?: boolean
  /** Use light wordmark text for placement on a dark background. */
  onDark?: boolean
  /** Stack logo above the wordmark instead of side-by-side. */
  layout?: 'horizontal' | 'vertical'
}>(), {
  size: 'md',
  wordmark: true,
  onDark: false,
  layout: 'horizontal',
})

const markSizes = {
  sm: 'size-9',
  md: 'size-12',
  lg: 'size-16',
  xl: 'size-20',
}

/** Wordmark height (the SVG is the hand-drawn "PRB" lettering, ratio 236:100). */
const wordmarkHeights = {
  sm: 'h-3',
  md: 'h-[18px]',
  lg: 'h-6',
  xl: 'h-8',
}

const verticalWordmarkHeights = {
  sm: 'h-2.5',
  md: 'h-3',
  lg: 'h-3.5',
  xl: 'h-4',
}
</script>

<template>
  <div
    :class="cn(
      layout === 'vertical'
        ? 'flex flex-col items-start gap-1'
        : 'flex items-center gap-2.5',
      props.class,
    )"
  >
    <img
      src="/brand/prb-icon.svg"
      :alt="wordmark ? '' : 'PRB'"
      :class="cn('shrink-0 object-contain', markSizes[size])"
    >
    <img
      v-if="wordmark"
      :src="onDark ? '/brand/prb-wordmark-white.svg' : '/brand/prb-wordmark.svg'"
      alt="PRB"
      :class="cn(
        'w-auto shrink-0',
        layout === 'vertical' ? verticalWordmarkHeights[size] : wordmarkHeights[size],
      )"
    >
  </div>
</template>
