<script setup lang="ts">
import { computed } from 'vue'
import { BadgeCheck, ChevronRight, Star } from '@lucide/vue'
import Avatar from '@/core/ui/Avatar.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import type { PublicAgent } from '@/modules/marketplace/services/agents.service'

const props = defineProps<{
  agent: PublicAgent
}>()

defineEmits<{ open: [] }>()

const locale = useLocaleStore()

const ratingLabel = computed(() =>
  props.agent.rating_avg !== null ? props.agent.rating_avg.toFixed(1) : null,
)

const distanceLabel = computed(() => {
  const m = props.agent.distance_m
  if (m == null) return null
  return m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`
})
</script>

<template>
  <button
    type="button"
    class="pressable flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3.5 text-left shadow-sm"
    @click="$emit('open')"
  >
    <Avatar :src="agent.company_logo" :name="agent.company_name" size="md" class="shrink-0 rounded-xl" />

    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-1.5">
        <h3 class="truncate font-semibold leading-tight">
          {{ agent.company_name }}
        </h3>
        <BadgeCheck class="size-4 shrink-0 fill-primary text-primary-foreground" />
      </div>
      <p v-if="agent.location_label" class="mt-0.5 truncate text-sm text-muted-foreground">
        {{ agent.location_label }}
      </p>
      <div class="mt-1.5 flex flex-wrap items-center gap-2">
        <span
          v-if="ratingLabel"
          class="inline-flex items-center gap-1 text-xs font-medium text-warning"
        >
          <Star class="size-3 fill-warning" />
          {{ ratingLabel }}
          <span class="text-muted-foreground">({{ agent.rating_count }})</span>
        </span>
        <span v-if="distanceLabel" class="text-xs text-muted-foreground">
          {{ locale.t.marketplace.distanceFrom }} {{ distanceLabel }}
        </span>
      </div>
    </div>

    <ChevronRight class="size-5 shrink-0 text-muted-foreground" />
  </button>
</template>
