<script setup lang="ts">
import { categoryIcon } from '@/modules/orders/lib/category-icon'
import type { Category } from '@/modules/agent/types/agent'

/**
 * A category's visual: the admin-uploaded image when there is one, otherwise
 * the generated icon. Drop it inside any fixed-size tile — the image fills the
 * tile and inherits its corner radius.
 */
const props = defineProps<{
  category: Category | null | undefined
  /** Icon size in px for the fallback (the image always fills its tile). */
  size?: number
}>()

const iconSize = () => `${props.size ?? 20}px`
</script>

<template>
  <img
    v-if="category?.image"
    :src="category.image"
    alt=""
    class="category-thumb"
  >
  <component
    :is="categoryIcon(category)"
    v-else
    :style="{ width: iconSize(), height: iconSize() }"
  />
</template>

<style scoped>
.category-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: inherit;
  display: block;
}
</style>
