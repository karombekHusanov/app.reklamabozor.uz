<script setup lang="ts">
import { computed } from 'vue'
import { Check, MapPin, Star } from '@lucide/vue'
import Avatar from '@/core/ui/Avatar.vue'
import { categoryName } from '@/core/i18n/category-name'
import { useLocaleStore } from '@/core/i18n/locale.store'
import type { PublicAgent } from '@/modules/marketplace/services/agents.service'

const props = defineProps<{
  agent: PublicAgent
}>()

defineEmits<{ open: [] }>()

const locale = useLocaleStore()

const ratingLabel = computed(() => {
  const stars = props.agent.stars ?? props.agent.rating_avg
  return stars !== null ? stars.toFixed(1) : null
})

const reviewCount = computed(() => props.agent.stars_count || props.agent.rating_count)

const chips = computed(() => props.agent.categories.slice(0, 2).map(c => categoryName(c, locale.locale)))

const distanceLabel = computed(() => {
  const m = props.agent.distance_m
  if (m == null) return null
  return m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`
})
</script>

<template>
  <button
    type="button"
    class="rb-card rb-card--interactive flex w-full flex-col gap-3 p-4 text-left"
    @click="$emit('open')"
  >
    <div class="flex items-center gap-3">
      <div class="relative size-[54px] shrink-0">
        <Avatar
          :src="agent.company_logo ?? agent.avatar"
          :name="agent.display_name"
          size="md"
          class="size-[54px] rounded-2xl"
        />
        <span
          class="rb-seal"
          :title="locale.t.home.verifiedLabel"
        >
          <Check class="size-3" />
        </span>
      </div>

      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-1.5">
          <h3 class="rb-font-display min-w-0 truncate text-[16px] font-extrabold tracking-[-0.01em] text-foreground">
            {{ agent.display_name }}
          </h3>
        </div>
        <div class="mt-1 flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
          <span
            v-if="ratingLabel"
            class="inline-flex items-center gap-1 font-extrabold tabular-nums text-foreground"
          >
            <Star class="size-[13px]" :style="{ color: 'var(--rb-rating)', fill: 'var(--rb-rating)' }" />
            {{ ratingLabel }}
            <span class="font-medium text-muted-foreground">({{ reviewCount }})</span>
          </span>
          <span v-if="ratingLabel" class="opacity-40">·</span>
          <span>{{ locale.t.home.jobsCount.replace('{count}', String(agent.completed_orders_count)) }}</span>
        </div>
      </div>
    </div>

    <p
      v-if="agent.bio"
      class="line-clamp-2 min-h-[36px] text-[12.5px] leading-[1.45] text-muted-foreground"
    >
      {{ agent.bio }}
    </p>

    <div class="flex flex-wrap items-center gap-1.5">
      <span class="rb-chip rb-chip--vf"><Check class="size-[11px]" />{{ locale.t.home.verifiedLabel }}</span>
      <span
        v-if="agent.grade != null && agent.grade_label"
        class="rb-chip"
      >{{ agent.grade_label }}</span>
      <span
        v-for="(chip, i) in chips"
        :key="i"
        class="rb-chip"
      >{{ chip }}</span>
      <span
        v-if="distanceLabel"
        class="rb-chip inline-flex items-center gap-1"
      ><MapPin class="size-[11px]" />{{ distanceLabel }}</span>
    </div>
  </button>
</template>
