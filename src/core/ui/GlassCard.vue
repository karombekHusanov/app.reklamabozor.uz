<script setup lang="ts">
import { cn } from '@/core/lib/utils'
import type { HTMLAttributes } from 'vue'

const props = withDefaults(defineProps<{
  class?: HTMLAttributes['class']
  padding?: 'none' | 'sm' | 'md' | 'lg'
  interactive?: boolean
}>(), {
  padding: 'md',
  interactive: false,
})

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
}
</script>

<template>
  <div
    :class="cn(
      'glass-card rounded-3xl border shadow-[0_8px_32px_rgba(15,23,42,0.08)]',
      paddingClasses[padding],
      interactive && 'transition-transform duration-200 active:scale-[0.98]',
      props.class,
    )"
  >
    <slot />
  </div>
</template>
