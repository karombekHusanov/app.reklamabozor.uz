<script setup lang="ts">
import { Inbox, ListFilter, Search } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import EmptyState from '@/core/ui/EmptyState.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import LiveOrderCard from '@/modules/home/components/LiveOrderCard.vue'
import LiveOrdersHeaderArt from '@/modules/home/components/LiveOrdersHeaderArt.vue'
import LiveOrdersFilterDrawer from '@/modules/home/components/LiveOrdersFilterDrawer.vue'
import { useLiveOrdersFeed } from '@/modules/home/composables/useLiveOrdersFeed'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { useTelegram } from '@/core/composables/useTelegram'
import { useHomeStore } from '@/modules/home/stores/home.store'
import OrderRouteTabs from '@/modules/orders/components/OrderRouteTabs.vue'
import { useOrderRouteStore } from '@/modules/orders/stores/order-route.store'
import type { OrderRoute } from '@/modules/orders/types/order'

const locale = useLocaleStore()
const home = useHomeStore()
const routeStore = useOrderRouteStore()
const requestRoute = computed({
  get: (): OrderRoute => routeStore.active,
  set: (route) => { routeStore.set(route) },
})
const { haptic } = useTelegram()

const { orders, categories, regions, searchQuery, filters, loading, filtersActive, hasActiveQuery } = useLiveOrdersFeed(
  computed(() => routeStore.active),
  (list, filtered) => {
    if (!filtered) home.liveOrders = list.slice(0, 10)
  },
)
const filterOpen = ref(false)

onMounted(() => {
  void home.markLiveOrdersSeen()
})

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
      trailing-overlay
    >
      <template #trailing>
        <div class="size-[5.5rem] -rotate-[10deg] drop-shadow-[0_8px_14px_rgba(106,164,216,0.28)]">
          <LiveOrdersHeaderArt />
        </div>
      </template>
    </AppHeader>

    <section class="px-5 pb-1 pt-2">
      <OrderRouteTabs
        v-model="requestRoute"
        :tender-locked="!routeStore.canCreateTender"
      />
    </section>

    <section class="flex items-center gap-2 px-5 pb-1 pt-2">
      <div class="glass-input flex h-11 min-w-0 flex-1 items-center gap-2.5 !rounded-2xl !bg-card !py-0 shadow-[0_8px_20px_-16px_rgba(15,23,42,0.35)]">
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
        class="relative flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-card text-foreground shadow-[0_8px_20px_-16px_rgba(15,23,42,0.35)] transition active:scale-95"
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
          class="h-[228px] w-full rounded-[1.25rem]"
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
