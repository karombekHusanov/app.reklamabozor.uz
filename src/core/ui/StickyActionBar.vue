<script setup lang="ts">
/**
 * Docks form actions (e.g. a submit button) to the bottom of the viewport while
 * scrolling a long form. Sits above the tab bar; in Telegram the WebView resizes
 * on keyboard open, so it stays above the keyboard while typing.
 *
 * Pass `class` to override the bottom offset — e.g. pages that hide the tab bar
 * dock the bar lower (`bottom-4`) so there is no empty gap beneath it.
 */
import { cn } from '@/core/lib/utils'
import type { HTMLAttributes } from 'vue'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div :class="cn('sticky bottom-20 z-20 pt-1', props.class)">
    <slot />
  </div>
</template>
