<script setup lang="ts">
import type { OrderHashtag } from '@/modules/orders/types/order'

defineProps<{
  hashtags: OrderHashtag[] | null | undefined
  /** When true, chips are tappable (emit select). */
  interactive?: boolean
}>()

defineEmits<{
  select: [slug: string]
}>()
</script>

<template>
  <div
    v-if="hashtags?.length"
    class="flex flex-wrap gap-1.5"
  >
    <component
      :is="interactive ? 'button' : 'span'"
      v-for="tag in hashtags"
      :key="tag.id"
      type="button"
      class="glass-chip text-[11px] font-semibold"
      :class="interactive ? 'pressable cursor-pointer' : ''"
      @click="interactive && $emit('select', tag.slug)"
    >
      #{{ tag.label || tag.slug }}
    </component>
  </div>
</template>
