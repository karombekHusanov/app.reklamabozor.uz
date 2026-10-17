<script setup lang="ts">
import CategoryTreePicker from '@/core/ui/CategoryTreePicker.vue'
import type { Category } from '@/modules/agent/types/agent'

/**
 * Multi-select over the category tree for the executor profile: drill into
 * sections, tick leaves or whole sections (a section covers all of its
 * sub-categories when matching orders).
 */
defineProps<{
  categories: Category[]
}>()

const selectedIds = defineModel<number[]>({ required: true })
</script>

<template>
  <div class="profile-category-list">
    <CategoryTreePicker
      v-model="selectedIds"
      mode="multi"
      :categories="categories"
    />
  </div>
</template>
