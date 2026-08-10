<script setup lang="ts">
import { ChevronRight } from '@lucide/vue'
import { useLocaleStore } from '@/core/i18n/locale.store'

defineProps<{
  title: string
  showViewAll?: boolean
}>()

defineEmits<{
  viewAll: []
}>()

const locale = useLocaleStore()
</script>

<template>
  <section class="app-section !px-4 !pt-4 sm:!px-5">
    <div class="app-section__header">
      <h3 class="app-section__title">
        {{ title }}
      </h3>
      <button
        v-if="showViewAll"
        type="button"
        class="app-section__link"
        @click="$emit('viewAll')"
      >
        {{ locale.t.profile.agentViewAll }}
        <ChevronRight class="size-3.5" />
      </button>
    </div>

    <div class="mt-1">
      <slot />
    </div>
  </section>
</template>
