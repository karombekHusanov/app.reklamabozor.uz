<script setup lang="ts">
import { cn } from '@/core/lib/utils'
import type { HTMLAttributes } from 'vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  class?: HTMLAttributes['class']
  /** Logo mark diameter. */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Render the "Reklama Bozor" wordmark next to the mark. */
  wordmark?: boolean
  /** Use light wordmark text for placement on a dark background. */
  onDark?: boolean
}>(), {
  size: 'md',
  wordmark: true,
  onDark: false,
})

const markSizes = {
  sm: 'size-9',
  md: 'size-12',
  lg: 'size-16',
  xl: 'size-20',
}

const textSizes = {
  sm: 'text-base',
  md: 'text-xl',
  lg: 'text-2xl',
  xl: 'text-3xl',
}
</script>

<template>
  <div :class="cn('flex items-center gap-3', props.class)">
    <img
      src="/images/logo.png"
      alt="Reklama Bozor"
      :class="cn('shrink-0 object-contain', markSizes[size])"
    >
    <div v-if="wordmark" :class="cn('font-bold leading-none tracking-tight', textSizes[size])">
      <span :class="onDark ? 'text-white' : 'text-foreground'">Reklama</span>
      <span class="block italic text-primary">Bozor</span>
    </div>
  </div>
</template>
