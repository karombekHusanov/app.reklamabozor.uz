<script setup lang="ts">
import { Brush, ListFilter, Search } from '@lucide/vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import EmptyState from '@/core/ui/EmptyState.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import MarketplaceFilterDrawer from '@/modules/marketplace/components/MarketplaceFilterDrawer.vue'
import {
  EMPTY_MARKETPLACE_FILTERS,
  isMarketplaceFilterActive,
  type MarketplaceFilterState,
} from '@/modules/marketplace/lib/marketplace-filters'
import { getApiErrorMessage } from '@/core/api/api-error'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { useTelegram } from '@/core/composables/useTelegram'
import AgentCard from '@/modules/marketplace/components/AgentCard.vue'
import { fetchDesigners, type PublicAgent } from '@/modules/marketplace/services/agents.service'
import { fetchCategories } from '@/modules/orders/services/orders.service'
import type { Category } from '@/modules/agent/types/agent'

const locale = useLocaleStore()
const router = useRouter()
const { haptic } = useTelegram()

const designers = ref<PublicAgent[]>([])
const categories = ref<Category[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const searchQuery = ref('')
const debouncedQuery = ref('')
const filters = ref<MarketplaceFilterState>({ ...EMPTY_MARKETPLACE_FILTERS })
const filterOpen = ref(false)

let searchTimer: ReturnType<typeof setTimeout> | null = null

const filtersActive = computed(() => isMarketplaceFilterActive(filters.value))
const hasActiveQuery = computed(() => debouncedQuery.value.trim().length > 0)

const filterCopy = computed(() => ({
  filterTitle: locale.t.designers.filterTitle,
  filterCategory: locale.t.designers.filterCategory,
  filterAll: locale.t.designers.filterAll,
  filterApply: locale.t.designers.filterApply,
  filterReset: locale.t.designers.filterReset,
}))

const emptyDescription = computed(() => {
  if (hasActiveQuery.value || filtersActive.value) {
    return locale.t.designers.filterEmpty
  }
  return locale.t.designers.emptyApproved
})

watch(searchQuery, (value) => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    debouncedQuery.value = value
  }, 300)
})

async function loadDesigners() {
  loading.value = true
  error.value = null
  try {
    designers.value = await fetchDesigners(50, {
      q: debouncedQuery.value.trim() || null,
      category_ids: filters.value.categoryIds,
    })
  }
  catch (e) {
    error.value = getApiErrorMessage(e)
    designers.value = []
  }
  finally {
    loading.value = false
  }
}

onMounted(async () => {
  const categoriesResult = await Promise.allSettled([fetchCategories('designer')])
  categories.value = categoriesResult[0].status === 'fulfilled' ? categoriesResult[0].value : []
  await loadDesigners()
})

watch([debouncedQuery, filters], () => {
  void loadDesigners()
}, { deep: true })

function openFilters() {
  haptic('light')
  filterOpen.value = true
}

function openDesigner(id: number) {
  router.push(`/agents/${id}`)
}
</script>

<template>
  <div class="pb-6">
    <AppHeader
      :title="locale.t.designers.title"
      :subtitle="locale.t.designers.subtitle"
      show-back
    />

    <section class="flex items-center gap-2 px-4 pb-1 pt-1">
      <div class="glass-input flex h-11 min-w-0 flex-1 items-center gap-2.5 !py-0">
        <Search class="size-4 shrink-0 text-muted-foreground" />
        <input
          v-model="searchQuery"
          type="search"
          :placeholder="locale.t.designers.searchPlaceholder"
          class="w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
        >
      </div>
      <button
        type="button"
        class="relative flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-card text-foreground transition active:scale-95"
        :class="filtersActive ? 'border-primary/40 bg-primary/10 text-primary' : ''"
        :aria-label="locale.t.designers.filterTitle"
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

    <section class="space-y-3 px-4 pt-3">
      <template v-if="loading">
        <Skeleton
          v-for="n in 4"
          :key="n"
          class="h-24 w-full rounded-3xl"
        />
      </template>

      <p
        v-else-if="error"
        class="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
      >
        {{ error }}
      </p>

      <GlassCard
        v-else-if="designers.length === 0"
        padding="none"
        class="overflow-hidden"
      >
        <EmptyState
          :icon="Brush"
          :title="locale.t.designers.emptyTitle"
          :description="emptyDescription"
        />
      </GlassCard>

      <div
        v-else
        class="space-y-3"
      >
        <AgentCard
          v-for="designer in designers"
          :key="designer.id"
          :agent="designer"
          @open="openDesigner(designer.id)"
        />
      </div>
    </section>
  </div>
</template>
