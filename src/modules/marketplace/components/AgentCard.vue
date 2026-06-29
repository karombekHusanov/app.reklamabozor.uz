<script setup lang="ts">
import { BadgeCheck, Star } from '@lucide/vue'
import Avatar from '@/core/ui/Avatar.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import type { PublicAgent } from '@/modules/marketplace/services/agents.service'

defineProps<{
  agent: PublicAgent
}>()

defineEmits<{ open: [] }>()

const locale = useLocaleStore()

// Placeholder metrics — no backend yet (rating, completed-orders, distance).
const RATING = '4.7'
const COMPLETED_ORDERS = 352
const DISTANCE = '1.8km'
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
          <p class="mt-1 text-xs text-slate-400">
            {{ locale.t.marketplace.completedOrders }}: <span class="font-semibold text-slate-500">{{ COMPLETED_ORDERS }}</span>
          </p>
        </div>
      </div>

      <!-- Distance -->
      <span class="absolute bottom-3 right-4 text-xs font-medium text-slate-400">
        {{ locale.t.marketplace.distanceFrom }} {{ DISTANCE }}
      </span>
    </div>
  </button>
</template>
