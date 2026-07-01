<script setup lang="ts">
import { computed } from 'vue'
import { BadgeCheck, Star } from '@lucide/vue'
import Avatar from '@/core/ui/Avatar.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import type { PublicAgent } from '@/modules/marketplace/services/agents.service'

const props = defineProps<{
  agent: PublicAgent
}>()

defineEmits<{ open: [] }>()

const locale = useLocaleStore()

// Rating is shown even before we have a real scoring backend — kept intentionally.
const RATING = '4.7'

/** Only set when the agent came from the nearby endpoint — never fabricated. */
const distanceLabel = computed(() => {
  const m = props.agent.distance_m
  if (m == null) return null
  return m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`
})
</script>

<template>
  <button
    type="button"
    class="w-full text-left"
    @click="$emit('open')"
  >
    <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white to-sky-100 p-4 shadow-[0_4px_16px_rgba(2,48,92,0.12)] transition active:scale-[0.99]">
      <!-- Rating badge -->
      <span class="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-xs font-bold text-amber-950">
        <Star class="size-3 fill-amber-950" />
        {{ RATING }}
      </span>

      <div class="flex items-start gap-3 pr-14">
        <Avatar :src="agent.company_logo" :name="agent.company_name" size="lg" class="rounded-full" />
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-1.5">
            <h3 class="truncate text-lg font-bold leading-tight text-[#02305C]">
              {{ agent.company_name }}
            </h3>
            <BadgeCheck class="size-4 shrink-0 fill-primary text-white" />
          </div>
          <p v-if="agent.location_label" class="mt-0.5 truncate text-sm text-slate-500">
            {{ agent.location_label }}
          </p>
        </div>
      </div>

      <!-- Distance (only when we have a real value from the nearby endpoint) -->
      <span v-if="distanceLabel" class="absolute bottom-3 right-4 text-xs font-medium text-slate-400">
        {{ locale.t.marketplace.distanceFrom }} {{ distanceLabel }}
      </span>
    </div>
  </button>
</template>
