<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/core/lib/utils'
import type { HTMLAttributes } from 'vue'

const props = withDefaults(defineProps<{
  class?: HTMLAttributes['class']
  name?: string
  /** Image URL. When present the photo is shown; otherwise initials are rendered. */
  src?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
}>(), {
  size: 'md',
})

const sizes = {
  sm: 'size-8 text-xs',
  md: 'size-11 text-sm',
  lg: 'size-16 text-lg',
  xl: 'size-20 text-xl',
}

const initials = computed(() =>
  props.name
    ?.split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase(),
)
</script>

<template>
  <div
    :class="cn(
      'relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl font-semibold text-white shadow-lg shadow-blue-500/20',
      !src && 'bg-gradient-to-br from-sky-400 to-blue-600',
      sizes[size],
      props.class,
    )"
  >
    <img
      v-if="src"
      :src="src"
      :alt="name ?? 'avatar'"
      class="size-full object-cover"
    >
    <slot v-else>{{ initials }}</slot>
  </div>
</template>
