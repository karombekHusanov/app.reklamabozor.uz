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
  <section class="client-profile-section home-card px-3 pb-3 pt-4 sm:px-4 sm:pb-4 sm:pt-5">
    <div class="flex items-center justify-between gap-2">
      <h3 class="pt-0.5 text-[0.9rem] font-bold text-foreground">
        {{ title }}
      </h3>
      <button
        v-if="showViewAll"
        type="button"
        class="pressable inline-flex shrink-0 items-center gap-0.5 text-[11px] font-semibold text-primary"
        @click="$emit('viewAll')"
      >
        {{ locale.t.profile.agentViewAll }}
        <ChevronRight class="size-3.5" />
      </button>
    </div>

    <div class="mt-3">
      <slot />
    </div>
  </section>
</template>
