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
  <section class="agent-profile-section">
    <div class="agent-profile-section__header">
      <h3 class="agent-profile-section__title">
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

    <div class="agent-profile-section__body">
      <slot />
    </div>
  </section>
</template>
