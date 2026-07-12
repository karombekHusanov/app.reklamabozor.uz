<script setup lang="ts">
import { ChevronRight, Star } from '@lucide/vue'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import Avatar from '@/core/ui/Avatar.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import HomeAgentCardSkeleton from '@/modules/home/components/HomeAgentCardSkeleton.vue'
import { categoryName } from '@/core/i18n/category-name'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { useHomeStore } from '@/modules/home/stores/home.store'
import { ROUTES } from '@/modules/shell/constants/routes'
import type { PublicAgent } from '@/modules/marketplace/services/agents.service'

const locale = useLocaleStore()
const router = useRouter()
const home = useHomeStore()

const loading = computed(() => !home.hasLoaded && home.isLoading)
const visibleAgents = computed(() => home.topAgents)

function rankClass(rank: number): string {
  const base = 'top-agents-rank'
  if (rank === 1) return `${base} top-agents-rank--1`
  if (rank === 2) return `${base} top-agents-rank--2`
  if (rank === 3) return `${base} top-agents-rank--3`
  return `${base} top-agents-rank--default`
}

function agentCategory(agent: PublicAgent): string | null {
  const first = agent.categories[0]
  if (first) return categoryName(first, locale.locale)
  return agent.bio
}

function agentRating(agent: PublicAgent): string {
  if (agent.rating_avg !== null) return agent.rating_avg.toFixed(1)
  return (4.5 + (agent.completion_percent / 100) * 0.5).toFixed(1)
}

function openAgent(id: number) {
  router.push(`/agents/${id}`)
}
</script>

<template>
  <div v-if="loading || visibleAgents.length" class="home-card overflow-hidden p-4">
    <div class="flex items-center justify-between pb-1">
      <template v-if="loading">
        <Skeleton class="top-agents-skeleton--strong h-5 w-32 rounded-md" />
        <Skeleton class="top-agents-skeleton h-4 w-20 rounded-md" />
      </template>
      <template v-else>
        <h2 class="text-base font-bold text-foreground">
          {{ locale.t.home.topAgencies }}
        </h2>
        <button
          type="button"
          class="pressable inline-flex items-center gap-0.5 text-sm font-medium text-muted-foreground transition active:text-foreground"
          @click="router.push(ROUTES.agencies)"
        >
          {{ locale.t.home.viewAllAgents }}
          <ChevronRight class="size-4" />
        </button>
      </template>
    </div>

    <div v-if="loading" class="top-agents-list">
      <HomeAgentCardSkeleton v-for="n in 4" :key="n" />
    </div>

    <div v-else class="top-agents-list">
      <button
        v-for="(agent, index) in visibleAgents"
        :key="agent.id"
        type="button"
        class="top-agents-row"
        @click="openAgent(agent.id)"
      >
        <span :class="rankClass(index + 1)">
          {{ index + 1 }}
        </span>

        <Avatar
          :src="agent.company_logo ?? agent.avatar"
          :name="agent.display_name"
          size="md"
          class="top-agents-avatar"
        />

        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-bold text-foreground">
            {{ agent.display_name }}
          </p>
          <p v-if="agentCategory(agent)" class="truncate text-xs text-muted-foreground">
            {{ agentCategory(agent) }}
          </p>
        </div>

        <div class="flex shrink-0 flex-col items-end gap-1">
          <span class="inline-flex items-center gap-1 text-sm font-bold text-foreground">
            <Star class="size-3.5 fill-amber-400 text-amber-400 dark:fill-amber-300 dark:text-amber-300" />
            {{ agentRating(agent) }}
          </span>
          <span class="text-[11px] font-medium text-muted-foreground">
            {{ locale.t.home.ordersDone.replace('{count}', String(agent.completed_orders_count)) }}
          </span>
        </div>
      </button>
    </div>
  </div>
</template>
