<script setup lang="ts">
import { useLocaleStore } from '@/core/i18n/locale.store'
import { categoryName } from '@/core/i18n/category-name'
import type { Category } from '@/modules/agent/types/agent'

defineProps<{
  categories: Category[]
}>()

const locale = useLocaleStore()
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <span
      v-for="category in categories"
      :key="category.id"
      class="inline-flex items-center gap-1.5 rounded-full bg-primary/8 px-3 py-1.5 text-xs font-medium text-primary ring-1 ring-inset ring-primary/15"
    >
      <span class="size-1.5 rounded-full bg-primary/60" />
      {{ categoryName(category, locale.locale) }}
    </span>
  </div>
</template>
