<script setup lang="ts">
import { cn } from '@/core/lib/utils'
import type { HTMLAttributes } from 'vue'

const props = withDefaults(defineProps<{
  class?: HTMLAttributes['class']
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'pill'
  interactive?: boolean
  /** Full pill / stadium shape (e.g. tab bar). */
  rounded?: boolean
  /** Frosted glass surface with gradient border overlay. */
  frosted?: boolean
}>(), {
  padding: 'md',
  interactive: false,
  rounded: false,
  frosted: false,
})

const paddingClasses = {
  none: '',
  xs: 'p-2',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
  pill: 'p-1',
}
</script>

<template>
  <div
    :class="cn(
      'relative overflow-hidden transition-shadow duration-300',
      props.rounded ? 'rounded-full' : 'rounded-3xl',
      paddingClasses[padding],
      props.frosted
        ? 'glass-card-frosted backdrop-blur-sm'
        : 'glass-card border shadow-[0_2px_12px_rgba(2,48,92,0.06)]',
      interactive && 'transition-transform duration-200 active:scale-[0.98]',
      props.class,
    )"
  >
    <div
      v-if="frosted"
      class="glass-card-frosted-border pointer-events-none absolute inset-0"
      :class="props.rounded ? 'rounded-full' : 'rounded-3xl'"
    />
    <slot />
  </div>
</template>
