<script setup lang="ts">
import { cn } from '@/core/lib/utils'
import type { HTMLAttributes } from 'vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  class?: HTMLAttributes['class']
  /** Logo tile edge length. */
  size?: 'sm' | 'md' | 'lg' | 'xl'
}>(), {
  size: 'md',
})

/** The logo carries its own "PRB" lettering + tagline, so it is a single square tile. */
const sizes = {
  sm: 'size-10 rounded-xl',
  md: 'size-14 rounded-2xl',
  lg: 'size-24 rounded-[1.75rem]',
  xl: 'size-32 rounded-[2.25rem]',
}
</script>

<template>
  <img
    src="/brand/prb-logo.png"
    alt="PRB"
    :class="cn('shrink-0 object-contain shadow-[var(--rb-elev-1)]', sizes[size], props.class)"
  >
</template>
