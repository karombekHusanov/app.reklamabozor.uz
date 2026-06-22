<script setup lang="ts">
import { cn } from '@/core/lib/utils'
import type { HTMLAttributes } from 'vue'

const props = defineProps<{
  class?: HTMLAttributes['class']
  variant?: 'default' | 'primary' | 'success' | 'warning'
}>()

const variants = {
  default: 'bg-white/50 text-foreground dark:bg-white/10',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  warning: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
}
</script>

<template>
  <span
    :class="cn(
      'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium backdrop-blur-sm',
      variants[variant ?? 'default'],
      props.class,
    )"
  >
    <slot />
  </span>
</template>
