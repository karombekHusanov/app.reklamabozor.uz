<script setup lang="ts">
import { Inbox, Search, SlidersHorizontal } from '@lucide/vue'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import EmptyState from '@/core/ui/EmptyState.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import { useTelegram } from '@/core/composables/useTelegram'
import { useLocaleStore } from '@/core/i18n/locale.store'
import AgentOrderCard from '@/modules/agent/components/AgentOrderCard.vue'
import AgentStories from '@/modules/agent/components/AgentStories.vue'
import { usePassStore } from '@/modules/agent/stores/pass.store'
import LiveOrdersFilterDrawer from '@/modules/home/components/LiveOrdersFilterDrawer.vue'
import { useLiveOrdersFeed } from '@/modules/home/composables/useLiveOrdersFeed'
import { useHomeStore } from '@/modules/home/stores/home.store'
import type { OrderRoute } from '@/modules/orders/types/order'
import ModeSwitch from '@/modules/shell/components/ModeSwitch.vue'
import TopBarActions from '@/modules/shell/components/TopBarActions.vue'
import { ROUTES } from '@/modules/shell/constants/routes'

/** Agent workspace home: stories, then the open-order feed (search + route filter). */
const locale = useLocaleStore()
const router = useRouter()
const home = useHomeStore()
const pass = usePassStore()
const { haptic } = useTelegram()

const route = ref<OrderRoute | null>(null)
const { orders, categories, regions, searchQuery, filters, loading, filtersActive } = useLiveOrdersFeed(route)
const filterOpen = ref(false)

const routeChips = computed(() => [
  { value: null, label: locale.t.agentHome.all },
  { value: 'tezkor' as const, label: locale.t.route.tezkor },
  { value: 'tender' as const, label: locale.t.route.tender },
])

function pickRoute(value: OrderRoute | null) {
  if (route.value === value) return
  haptic('light')
  route.value = value
}

function openFilters() {
  haptic('light')
  filterOpen.value = true
}
</script>

<template>
  <div class="ah">
    <header class="ah__top brand-hero safe-top">
      <ModeSwitch />
      <TopBarActions
        show-map
        :notification-count="home.notificationCount"
        @map="router.push(ROUTES.map)"
        @notifications="router.push(ROUTES.notifications)"
      />
    </header>

    <div class="ah__sheet">
      <AgentStories class="pt-4" />

      <div class="ah__search">
        <div class="ah__row">
          <label class="ah__field">
            <Search class="size-[18px] shrink-0 text-muted-foreground" />
            <span class="sr-only">{{ locale.t.agentHome.searchPlaceholder }}</span>
            <input
              v-model="searchQuery"
              type="search"
              :placeholder="locale.t.agentHome.searchPlaceholder"
            >
          </label>
          <button
            type="button"
            class="ah__filter"
            :class="{ 'is-on': filtersActive }"
            :aria-label="locale.t.agentHome.filters"
            @click="openFilters"
          >
            <SlidersHorizontal class="size-[19px]" />
          </button>
        </div>
        <div
          class="ah__chips"
          role="tablist"
        >
          <button
            v-for="chip in routeChips"
            :key="chip.label"
            type="button"
            role="tab"
            class="ah__chip"
            :class="{ 'is-on': route === chip.value }"
            :aria-selected="route === chip.value"
            @click="pickRoute(chip.value)"
          >
            {{ chip.label }}
          </button>
        </div>
      </div>

      <section class="ah__list">
        <template v-if="loading">
          <Skeleton
            v-for="n in 4"
            :key="n"
            class="h-[180px] w-full rounded-[22px]"
          />
        </template>
        <div
          v-else-if="orders.length === 0"
          class="rounded-[22px] bg-card"
        >
          <EmptyState
            :icon="Inbox"
            :title="locale.t.agentHome.empty"
            :description="locale.t.agentHome.emptyBody"
          />
        </div>
        <template v-else>
          <AgentOrderCard
            v-for="order in orders"
            :key="order.id"
            :order="order"
            :fee-som="pass.otklikFeeSom"
          />
        </template>
      </section>
    </div>

    <LiveOrdersFilterDrawer
      v-model:open="filterOpen"
      v-model="filters"
      :categories="categories"
      :regions="regions"
    />
  </div>
</template>

<style scoped>
.ah { display: flex; min-height: 100%; flex-direction: column; }
.ah__top { display: flex; align-items: center; gap: 8px; padding: calc(max(env(safe-area-inset-top), 0.5rem) + 0.5rem) 16px 40px; color: #fff; }
.ah__sheet { position: relative; z-index: 1; flex: 1; margin-top: -26px; border-radius: 26px 26px 0 0; background: var(--background); }
.ah__search { position: sticky; top: 0; z-index: 5; display: flex; flex-direction: column; gap: 8px; padding: 8px 16px; background: var(--background); }
.ah__row { display: flex; gap: 8px; }
.ah__field {
  display: flex; flex: 1; min-width: 0; align-items: center; gap: 8px; height: 46px; padding: 0 14px;
  border-radius: 14px; background: var(--card); color: var(--foreground);
}
.ah__field input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--foreground); font: inherit; font-size: 15px; }
.ah__field input::placeholder { color: var(--muted-foreground); }
.ah__filter {
  position: relative; display: grid; place-items: center; width: 46px; height: 46px; flex-shrink: 0;
  border: 0; border-radius: 14px; background: var(--card); color: var(--foreground); cursor: pointer;
}
.ah__filter.is-on { background: color-mix(in srgb, var(--primary) 12%, var(--card)); color: var(--primary); }
.ah__chips { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; }
.ah__chip {
  flex-shrink: 0; min-height: 34px; padding: 0 12px; border: 1px solid var(--border); border-radius: var(--rb-r-chip);
  background: var(--card); color: var(--foreground); font-family: inherit; font-size: 12.5px; font-weight: 600; cursor: pointer;
}
.ah__chip.is-on { border-color: var(--foreground); background: var(--foreground); color: var(--background); }
.ah__chip:focus-visible, .ah__filter:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
.ah__list { display: flex; flex-direction: column; gap: 10px; padding: 4px 16px 16px; }
</style>
