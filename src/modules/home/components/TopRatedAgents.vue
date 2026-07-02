<script setup lang="ts">
import { ChevronRight, Star } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Avatar from '@/core/ui/Avatar.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import HomeAgentCardSkeleton from '@/modules/home/components/HomeAgentCardSkeleton.vue'
import { categoryName } from '@/core/i18n/category-name'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { ROUTES } from '@/modules/shell/constants/routes'
import { fetchTopAgents, type PublicAgent } from '@/modules/marketplace/services/agents.service'

const LIST_LIMIT = 5

const locale = useLocaleStore()
const router = useRouter()

const agents = ref<PublicAgent[]>([])
const loading = ref(true)

const visibleAgents = computed(() => agents.value.slice(0, LIST_LIMIT))

/** Medal-style rank badge classes for the podium (1-3); the rest stay neutral. */
function rankClasses(rank: number): string {
  switch (rank) {
    case 1:
      return 'bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950 ring-amber-200'
    case 2:
      return 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-800 ring-slate-100'
    case 3:
      return 'bg-gradient-to-br from-orange-300 to-orange-600 text-orange-950 ring-orange-200'
    default:
      return 'bg-[#0386D9]/12 text-[#02305C] ring-white/60'
  }
}

function agentCategory(agent: PublicAgent): string | null {
  const first = agent.categories[0]
  if (first) return categoryName(first, locale.locale)
  return agent.bio
}

/** Placeholder rating derived from profile completeness (no scoring backend yet). */
function agentRating(agent: PublicAgent): string {
  return (4.5 + (agent.completion_percent / 100) * 0.5).toFixed(1)
}

onMounted(async () => {
  try {
    agents.value = await fetchTopAgents(LIST_LIMIT)
  }
  finally {
    loading.value = false
  }
})

function openAgent(id: number) {
  router.push(`/agents/${id}`)
}
</script>

<template>
  <div v-if="loading || agents.length" class="home-card overflow-hidden p-4">
    <div class="flex items-center justify-between pb-1">
      <template v-if="loading">
        <Skeleton class="h-5 w-32 rounded-md bg-[#0386D9]/15" />
        <Skeleton class="h-4 w-20 rounded-md bg-[#0386D9]/10" />
      </template>
      <template v-else>
        <h2 class="text-base font-bold text-[#0b1f33]">
          {{ locale.t.home.topAgencies }}
        </h2>
        <button
          type="button"
          class="inline-flex items-center gap-0.5 text-sm font-medium text-[#5b6b7e] transition active:text-[#0b1f33]"
          @click="router.push(ROUTES.marketplace)"
        >
          {{ locale.t.home.viewAllAgents }}
          <ChevronRight class="size-4" />
        </button>
      </template>
    </div>

    <div v-if="loading" class="divide-y divide-[#0386D9]/10">
      <HomeAgentCardSkeleton v-for="n in 4" :key="n" />
    </div>

    <div v-else class="divide-y divide-[#0386D9]/10">
      <button
        v-for="(agent, index) in visibleAgents"
        :key="agent.id"
        type="button"
        class="flex w-full items-center gap-3 py-3 text-left transition active:opacity-80"
        @click="openAgent(agent.id)"
      >
        <span
          class="flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-extrabold shadow-sm ring-2"
          :class="rankClasses(index + 1)"
        >
          {{ index + 1 }}
        </span>

        <Avatar
          :src="agent.company_logo"
          :name="agent.company_name"
          size="md"
          class="shrink-0 rounded-full"
        />

        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-bold text-[#0b1f33]">
            {{ agent.company_name }}
          </p>
          <p v-if="agentCategory(agent)" class="truncate text-xs text-[#5b6b7e]">
            {{ agentCategory(agent) }}
          </p>
        </div>

        <div class="flex shrink-0 flex-col items-end gap-1">
          <span class="inline-flex items-center gap-1 text-sm font-bold text-[#0b1f33]">
            <Star class="size-3.5 fill-amber-400 text-amber-400" />
            {{ agentRating(agent) }}
          </span>
          <span class="text-[11px] font-medium text-[#5b6b7e]">
            {{ locale.t.home.ordersDone.replace('{count}', String(agent.completed_orders_count)) }}
          </span>
        </div>
      </button>
    </div>
  </div>
</template>
