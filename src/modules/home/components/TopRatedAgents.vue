<script setup lang="ts">
import { ChevronRight, Crown, Star } from '@lucide/vue'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import GlassCard from '@/core/ui/GlassCard.vue'
import Avatar from '@/core/ui/Avatar.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import { cn } from '@/core/lib/utils'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { ROUTES } from '@/modules/shell/constants/routes'
import { fetchTopAgents, type PublicAgent } from '@/modules/marketplace/services/agents.service'

const locale = useLocaleStore()
const router = useRouter()

const agents = ref<PublicAgent[]>([])
const loading = ref(true)

// Rating is shown even before we have a real scoring backend — kept intentionally.
const RATING = '4.7'

// Ranked 1-3 stand out as featured "top" cards; the rest are compact standard rows.
// The ranking itself just mirrors the order the API already returns (completion-based
// for now) — real rating-driven ranking is a backend concern for later.
const RANK_STYLES = [
  { badge: 'bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950', card: 'border-amber-300/60 bg-gradient-to-br from-amber-50 to-white dark:border-amber-400/30 dark:from-amber-500/10 dark:to-transparent' },
  { badge: 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-700', card: 'border-slate-300/60 dark:border-white/15' },
  { badge: 'bg-gradient-to-br from-orange-300 to-orange-500 text-orange-950', card: 'border-orange-300/60 dark:border-orange-400/25' },
]

onMounted(async () => {
  try {
    agents.value = await fetchTopAgents(10)
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
  <div v-if="loading || agents.length" class="space-y-3">
    <div class="flex items-center justify-between px-1">
      <h2 class="text-lg font-bold text-white">
        {{ locale.t.home.topAgencies }}
      </h2>
      <button
        type="button"
        class="inline-flex items-center gap-0.5 text-sm text-white/70"
        @click="router.push(ROUTES.marketplace)"
      >
        {{ locale.t.home.viewAllAgents }}
        <ChevronRight class="size-4" />
      </button>
    </div>

    <!-- Loading -->
    <template v-if="loading">
      <Skeleton v-for="n in 3" :key="n" class="h-20 w-full rounded-3xl" />
    </template>

    <template v-else>
      <!-- Top 3 — featured cards with a rank medal -->
      <GlassCard
        v-for="(agent, index) in agents.slice(0, 3)"
        :key="agent.id"
        padding="sm"
        interactive
        :class="cn('flex items-center gap-3', RANK_STYLES[index].card)"
        @click="openAgent(agent.id)"
      >
        <div class="relative shrink-0">
          <Avatar :src="agent.company_logo" :name="agent.company_name" size="lg" class="rounded-2xl" />
          <span
            class="absolute -bottom-1.5 -right-1.5 flex size-6 items-center justify-center rounded-full text-[11px] font-bold ring-2 ring-card"
            :class="RANK_STYLES[index].badge"
          >
            <Crown v-if="index === 0" class="size-3.5" />
            <template v-else>{{ index + 1 }}</template>
          </span>
        </div>
        <div class="min-w-0 flex-1">
          <p class="truncate text-base font-bold leading-tight">
            {{ agent.company_name }}
          </p>
          <p v-if="agent.location_label" class="truncate text-xs text-muted-foreground">
            {{ agent.location_label }}
          </p>
        </div>
        <span class="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-xs font-bold text-amber-950">
          <Star class="size-3 fill-amber-950" />
          {{ RATING }}
        </span>
      </GlassCard>

      <!-- 4th onward — standard compact rows -->
      <GlassCard v-if="agents.length > 3" padding="none" class="overflow-hidden">
        <button
          v-for="(agent, index) in agents.slice(3)"
          :key="agent.id"
          type="button"
          class="flex w-full items-center gap-3 px-4 py-3 text-left transition active:bg-muted/60"
          :class="index !== agents.length - 4 && 'border-b border-border dark:border-white/10'"
          @click="openAgent(agent.id)"
        >
          <span class="w-4 shrink-0 text-center text-xs font-semibold text-muted-foreground">
            {{ index + 4 }}
          </span>
          <Avatar :src="agent.company_logo" :name="agent.company_name" size="sm" class="rounded-xl" />
          <span class="min-w-0 flex-1 truncate text-sm font-medium">
            {{ agent.company_name }}
          </span>
          <span class="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-muted-foreground">
            <Star class="size-3 fill-amber-400 text-amber-400" />
            {{ RATING }}
          </span>
        </button>
      </GlassCard>
    </template>
  </div>
</template>
