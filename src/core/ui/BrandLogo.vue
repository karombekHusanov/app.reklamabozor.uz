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

const textSizes = {
  sm: 'text-[11px]',
  md: 'text-lg',
  lg: 'text-2xl',
  xl: 'text-3xl',
}

const verticalTextSizes = {
  sm: 'text-[11px]',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
}
</script>

<template>
  <div
    :class="cn(
      layout === 'vertical'
        ? 'flex flex-col items-start gap-1'
        : 'flex items-center gap-1.5',
      props.class,
    )"
  >
    <img
      src="/images/logo.png"
      alt="Reklama Bozor"
      :class="cn('shrink-0 object-contain', markSizes[size])"
    >
    <div
      v-if="wordmark"
      :class="cn(
        'flex flex-col gap-0 font-bold italic leading-none tracking-tight',
        layout === 'vertical' ? verticalTextSizes[size] : textSizes[size],
        onDark ? 'text-white' : 'text-foreground',
      )"
    >
      <span>Reklama</span>
      <span>Bozor</span>
    </div>
  </div>
</template>
