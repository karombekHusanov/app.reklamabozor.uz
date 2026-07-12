<script setup lang="ts">
import { Check } from '@lucide/vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { categoryName } from '@/core/i18n/category-name'
import type { Category } from '@/modules/agent/types/agent'

defineProps<{
  categories: Category[]
}>()

const selectedIds = defineModel<number[]>({ required: true })

const locale = useLocaleStore()

function isSelected(id: number): boolean {
  return selectedIds.value.includes(id)
}

function toggle(id: number) {
  const next = [...selectedIds.value]
  const index = next.indexOf(id)
  if (index === -1) next.push(id)
  else next.splice(index, 1)
  selectedIds.value = next
}
</script>

<template>
  <div class="profile-category-list">
    <label
      v-for="category in categories"
      :key="category.id"
      class="profile-category-row pressable"
      :class="isSelected(category.id) && 'profile-category-row--selected'"
    >
      <span class="profile-category-row__label">
        {{ categoryName(category, locale.locale) }}
      </span>

      <span
        class="profile-category-row__checkbox"
        aria-hidden="true"
      >
        <Check
          v-if="isSelected(category.id)"
          class="size-3.5"
        />
      </span>

      <input
        type="checkbox"
        class="sr-only"
        :checked="isSelected(category.id)"
        @change="toggle(category.id)"
      >
    </label>
  </div>
</template>
