<script setup lang="ts">
import { Inbox, ListFilter, Search } from '@lucide/vue'
import { computed, onMounted, ref, watch } from 'vue'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import EmptyState from '@/core/ui/EmptyState.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import LiveOrderCard from '@/modules/home/components/LiveOrderCard.vue'
import LiveOrdersFilterDrawer from '@/modules/home/components/LiveOrdersFilterDrawer.vue'
import {
  datesFromPreset,
  EMPTY_LIVE_ORDERS_FILTERS,
  isFilterActive,
  type LiveOrdersFilterState,
} from '@/modules/home/lib/live-orders-filters'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { useTelegram } from '@/core/composables/useTelegram'
import { useHomeStore } from '@/modules/home/stores/home.store'
import { fetchCategories } from '@/modules/orders/services/orders.service'
import { fetchRegions } from '@/modules/orders/services/regions.service'
import { fetchLiveOrders, type LiveOrder } from '@/modules/home/services/live-orders.service'
import type { Category } from '@/modules/agent/types/agent'
import type { Region } from '@/modules/orders/types/region'

const locale = useLocaleStore()
const home = useHomeStore()
const { haptic } = useTelegram()

const orders = ref<LiveOrder[]>([])
const categories = ref<Category[]>([])
const regions = ref<Region[]>([])
const searchQuery = ref('')
const debouncedQuery = ref('')
const filters = ref<LiveOrdersFilterState>({ ...EMPTY_LIVE_ORDERS_FILTERS })
const filterOpen = ref(false)
const loading = ref(true)

let searchTimer: ReturnType<typeof setTimeout> | null = null

const filtersActive = computed(() => isFilterActive(filters.value))
const hasActiveQuery = computed(() => debouncedQuery.value.trim().length > 0)

watch(searchQuery, (value) => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    debouncedQuery.value = value
  }, 300)
})

async function loadOrders() {
  loading.value = true
  try {
    const dates = datesFromPreset(filters.value.datePreset)
    orders.value = await fetchLiveOrders(50, {
      q: debouncedQuery.value.trim() || null,
      category_ids: filters.value.categoryIds,
      region_id: filters.value.regionId,
      district_id: filters.value.districtId,
      created_from: dates.created_from,
      created_to: dates.created_to,
    })
    if (!hasActiveQuery.value && !filtersActive.value) {
      home.liveOrders = orders.value.slice(0, 10)
    }
  }
  catch {
    orders.value = []
  }
  finally {
    loading.value = false
  }
}

onMounted(async () => {
  void home.markLiveOrdersSeen()
  const [categoriesResult, regionsResult] = await Promise.allSettled([
    fetchCategories(),
    fetchRegions(),
  ])
  categories.value = categoriesResult.status === 'fulfilled' ? categoriesResult.value : []
  regions.value = regionsResult.status === 'fulfilled' ? regionsResult.value : []
  await loadOrders()
})

watch([debouncedQuery, filters], () => {
  void loadOrders()
}, { deep: true })

function openFilters() {
  haptic('light')
  filterOpen.value = true
}

const emptyTitle = computed(() => {
  if (hasActiveQuery.value || filtersActive.value) {
    return locale.t.home.liveOrdersFilterEmpty
  }
  return locale.t.home.liveOrdersEmpty
})
</script>

<template>
  <div class="pb-6">
    <AppHeader
      :title="locale.t.home.liveOrdersTitle"
      :subtitle="locale.t.home.liveOrdersSubtitle"
      show-back
    />

    <section class="flex items-center gap-2 px-5 pb-1 pt-2">
      <div class="glass-input flex h-11 min-w-0 flex-1 items-center gap-2.5 !py-0">
        <Search class="size-4 shrink-0 text-muted-foreground" />
        <input
          v-model="searchQuery"
          type="search"
          :placeholder="locale.t.home.liveOrdersSearchPlaceholder"
          class="w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
        >
      </div>
      <button
        type="button"
        class="relative flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-card text-foreground transition active:scale-95"
        :class="filtersActive ? 'border-primary/40 bg-primary/10 text-primary' : ''"
        :aria-label="locale.t.home.liveOrdersFilterTitle"
        @click="openFilters"
      >
        <ListFilter class="size-5" />
        <span
          v-if="filtersActive"
          class="absolute right-2 top-2 size-2 rounded-full bg-primary"
        />
      </button>
    </section>

    <LiveOrdersFilterDrawer
      v-model:open="filterOpen"
      v-model="filters"
      :categories="categories"
      :regions="regions"
    />

    <section class="space-y-3 px-5 pt-3">
      <template v-if="loading">
        <Skeleton
          v-for="n in 5"
          :key="n"
          class="h-[140px] w-full rounded-2xl"
        />
      </template>

      <GlassCard
        v-else-if="orders.length === 0"
        padding="none"
        class="overflow-hidden"
      >
        <EmptyState
          :icon="Inbox"
          :title="emptyTitle"
          :description="locale.t.home.liveOrdersSubtitle"
        />
      </GlassCard>

      <template v-else>
        <LiveOrderCard
          v-for="order in orders"
          :key="order.id"
          :order="order"
        />
      </template>
    </section>
  </div>
</template>
