<script setup lang="ts">
import { ListFilter, Search, Store } from '@lucide/vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import EmptyState from '@/core/ui/EmptyState.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import MarketplaceFilterDrawer from '@/modules/marketplace/components/MarketplaceFilterDrawer.vue'
import GlobalSearchDrawer from '@/modules/search/components/GlobalSearchDrawer.vue'
import {
  EMPTY_MARKETPLACE_FILTERS,
  isMarketplaceFilterActive,
  type MarketplaceFilterState,
} from '@/modules/marketplace/lib/marketplace-filters'
import { isDesignerProvider } from '@/modules/marketplace/lib/provider-capability'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { useTelegram } from '@/core/composables/useTelegram'
import AgentCard from '@/modules/marketplace/components/AgentCard.vue'
import { fetchTopAgents, type PublicAgent } from '@/modules/marketplace/services/agents.service'
import { fetchCategories } from '@/modules/orders/services/orders.service'
import { ROUTES } from '@/modules/shell/constants/routes'
import type { Category } from '@/modules/agent/types/agent'

const locale = useLocaleStore()
const route = useRoute()
const router = useRouter()
const { haptic } = useTelegram()

const agents = ref<PublicAgent[]>([])
const categories = ref<Category[]>([])
const loading = ref(true)
/** Comes from the search drawer (`?q=`) — the field here is only a trigger. */
const query = ref(typeof route.query.q === 'string' ? route.query.q : '')
/** Every category (agent + designer) — the search drawer matches against these. */
const allCategoriesList = ref<Category[]>([])
const filters = ref<MarketplaceFilterState>({ ...EMPTY_MARKETPLACE_FILTERS })
const filterOpen = ref(false)
const searchOpen = ref(false)

const filtersActive = computed(() => isMarketplaceFilterActive(filters.value))
const hasActiveQuery = computed(() => query.value.trim().length > 0)

/**
 * A plain browse shows agencies only; a search shows the whole marketplace —
 * agencies and designers — grouped by capability.
 */
const agencyResults = computed(() => agents.value.filter(agent => !isDesignerProvider(agent)))
const designerResults = computed(() =>
  hasActiveQuery.value ? agents.value.filter(isDesignerProvider) : [],
)

const filterCopy = computed(() => ({
  filterTitle: locale.t.agencies.filterTitle,
  filterCategory: locale.t.agencies.filterCategory,
  filterAll: locale.t.agencies.filterAll,
  filterApply: locale.t.agencies.filterApply,
  filterReset: locale.t.agencies.filterReset,
}))

const emptyDescription = computed(() => {
  if (hasActiveQuery.value || filtersActive.value) {
    return locale.t.agencies.filterEmpty
  }
  return locale.t.agencies.emptyApproved
})

async function loadAgents() {
  loading.value = true
  try {
    agents.value = await fetchTopAgents(
      50,
      undefined,
      // Searching spans every provider; browsing stays on the agency track.
      hasActiveQuery.value ? undefined : 'agent',
      {
        q: query.value.trim() || null,
        category_ids: filters.value.categoryIds,
      },
    )
  }
  catch {
    agents.value = []
  }
  finally {
    loading.value = false
  }
}

onMounted(async () => {
  const [agentCategories, allCategories] = await Promise.allSettled([
    fetchCategories('agent'),
    fetchCategories(),
  ])
  categories.value = agentCategories.status === 'fulfilled' ? agentCategories.value : []
  allCategoriesList.value = allCategories.status === 'fulfilled' ? allCategories.value : []
  await loadAgents()
})

watch([query, filters], () => {
  void loadAgents()
}, { deep: true })

// Keep the URL shareable/back-navigable as the query changes.
watch(query, (value) => {
  void router.replace({ path: ROUTES.agencies, query: value.trim() ? { q: value.trim() } : {} })
})

function openFilters() {
  haptic('light')
  filterOpen.value = true
}

function openSearch() {
  haptic('light')
  searchOpen.value = true
}

function openAgent(id: number) {
  void router.push(`/agents/${id}`)
}

function onSearchProvider(agent: PublicAgent) {
  openAgent(agent.id)
}

function onSearchService(category: Category) {
  void router.push(ROUTES.categoryDetail(category.id))
}

function onSearchViewAll(value: string) {
  query.value = value
}
</script>

<template>
  <div class="pb-6">
    <AppHeader
      :title="locale.t.agencies.title"
      :subtitle="locale.t.agencies.subtitle"
      show-back
    />

    <section class="flex items-center gap-2 px-4 pb-1 pt-1">
      <button
        type="button"
        class="glass-input flex h-11 min-w-0 flex-1 items-center gap-2.5 !py-0 text-left"
        :aria-label="locale.t.search.title"
        @click="openSearch"
      >
        <Search class="size-4 shrink-0 text-muted-foreground" />
        <span
          class="min-w-0 flex-1 truncate text-base"
          :class="query ? 'text-foreground' : 'text-muted-foreground'"
        >
          {{ query || locale.t.agencies.searchPlaceholder }}
        </span>
      </button>
      <button
        type="button"
        class="relative flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-card text-foreground transition active:scale-95"
        :class="filtersActive ? 'border-primary/40 bg-primary/10 text-primary' : ''"
        :aria-label="locale.t.agencies.filterTitle"
        @click="openFilters"
      >
        <ListFilter class="size-5" />
        <span
          v-if="filtersActive"
          class="absolute right-2 top-2 size-2 rounded-full bg-primary"
        />
      </button>
    </section>

    <MarketplaceFilterDrawer
      v-model:open="filterOpen"
      v-model="filters"
      :categories="categories"
      :copy="filterCopy"
    />

    <GlobalSearchDrawer
      v-model:open="searchOpen"
      :categories="allCategoriesList"
      @provider="onSearchProvider"
      @service="onSearchService"
      @view-all="onSearchViewAll"
    />

    <section class="space-y-3 px-4 pt-3">
      <template v-if="loading">
        <Skeleton
          v-for="n in 4"
          :key="n"
          class="h-24 w-full rounded-3xl"
        />
      </template>

      <GlassCard
        v-else-if="agents.length === 0"
        padding="none"
        class="overflow-hidden"
      >
        <EmptyState
          :icon="Store"
          :title="locale.t.agencies.emptyTitle"
          :description="emptyDescription"
        />
      </GlassCard>

      <template v-else>
        <div
          v-if="agencyResults.length"
          class="space-y-3"
        >
          <h2
            v-if="hasActiveQuery"
            class="agencies-sec"
          >
            {{ locale.t.search.agencies }}
            <span class="agencies-sec__n">{{ agencyResults.length }}</span>
          </h2>
          <AgentCard
            v-for="agent in agencyResults"
            :key="agent.id"
            :agent="agent"
            @open="openAgent(agent.id)"
          />
        </div>

        <div
          v-if="designerResults.length"
          class="space-y-3"
        >
          <h2 class="agencies-sec">
            {{ locale.t.search.designers }}
            <span class="agencies-sec__n">{{ designerResults.length }}</span>
          </h2>
          <AgentCard
            v-for="agent in designerResults"
            :key="agent.id"
            :agent="agent"
            @open="openAgent(agent.id)"
          />
        </div>
      </template>
    </section>
  </div>
</template>

<style scoped>
.agencies-sec {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 6px 2px 0;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--muted-foreground);
}
.agencies-sec__n {
  display: inline-grid;
  place-items: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: var(--rb-r-chip);
  background: var(--secondary);
  color: var(--secondary-foreground);
  font-size: 10px;
  letter-spacing: 0;
}
</style>
