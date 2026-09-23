<script setup lang="ts">
import { Inbox, MessageSquareDashed } from '@lucide/vue'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import GlassCard from '@/core/ui/GlassCard.vue'
import EmptyState from '@/core/ui/EmptyState.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import AgentOrderItem from '@/modules/agent/components/AgentOrderItem.vue'
import AgentOfferItem from '@/modules/agent/components/AgentOfferItem.vue'
import { useOrdersStore } from '@/modules/orders/stores/orders.store'
import OrderRouteTabs from '@/modules/orders/components/OrderRouteTabs.vue'
import { useOrderRouteStore } from '@/modules/orders/stores/order-route.store'
import type { OrderRoute } from '@/modules/orders/types/order'
import { ROUTES } from '@/modules/shell/constants/routes'
import type { AgentOffer } from '@/modules/orders/types/order'

const locale = useLocaleStore()

const props = defineProps<{
  /** Deep-link target — open the matching detail page once loaded. */
  focusOrderId?: number | null
}>()

// The active tab is shared with the page header so the subtitle can follow it.
const activeTab = defineModel<'orders' | 'offers'>('tab', { default: 'orders' })

const orders = useOrdersStore()
const routeStore = useOrderRouteStore()
const requestRoute = computed({
  get: (): OrderRoute => routeStore.active,
  set: (route) => { routeStore.set(route) },
})
const router = useRouter()

type OfferFilter = 'all' | 'pending' | 'active' | 'completed' | 'rejected'
const offerFilter = ref<OfferFilter>('all')

const ACTIVE_DEAL_STATUSES = ['awaiting_payment', 'in_progress', 'work_submitted']

// Tab 1 — open opportunities from /agent/orders, newest first.
// Filtered by the shared Tender | Tezkor tab (rows without a route are tenders).
const availableOrders = computed(() =>
  orders.availableOrders
    .filter(o => (o.route ?? 'tender') === routeStore.active)
    .sort((a, b) => b.id - a.id),
)

// Tab 2 — the agent's own offers from /agent/offers, newest first.
const myOffers = computed(() =>
  [...orders.myOffers].sort((a, b) => b.order.id - a.order.id),
)

function offerMatchesFilter(offer: AgentOffer, filter: OfferFilter): boolean {
  const orderStatus = offer.order.status ?? ''
  switch (filter) {
    case 'pending':
      return offer.status === 'pending'
    case 'active':
      return offer.status === 'accepted' && ACTIVE_DEAL_STATUSES.includes(orderStatus)
    case 'completed':
      return offer.status === 'accepted' && orderStatus === 'completed'
    case 'rejected':
      return offer.status === 'rejected' || orderStatus === 'cancelled'
    default:
      return true
  }
}

const offerFilters = computed(() => {
  const keys: OfferFilter[] = ['all', 'pending', 'active', 'completed', 'rejected']
  return keys.map(key => ({
    key,
    label: locale.t.agent[
      key === 'all' ? 'filterAll'
      : key === 'pending' ? 'filterPending'
      : key === 'active' ? 'filterActive'
      : key === 'completed' ? 'filterCompleted'
      : 'filterRejected'
    ],
    count: key === 'all'
      ? myOffers.value.length
      : myOffers.value.filter(o => offerMatchesFilter(o, key)).length,
  }))
})

const filteredOffers = computed(() =>
  myOffers.value.filter(offer => offerMatchesFilter(offer, offerFilter.value)),
)

const tabs = computed(() => [
  { key: 'orders' as const, label: locale.t.agent.tabNewOrders, count: availableOrders.value.length },
  { key: 'offers' as const, label: locale.t.agent.tabMyOffers, count: myOffers.value.length },
])

// --- Sliding segment pill (measured, so labels of any width stay aligned) ---
const segmentRef = ref<HTMLElement | null>(null)
const filterScrollRef = ref<HTMLElement | null>(null)
const pillWidth = ref(0)
const pillOffset = ref(0)
const pillReady = ref(false)

function updatePill() {
  const track = segmentRef.value
  if (!track) return
  const buttons = track.querySelectorAll<HTMLButtonElement>('[data-tab]')
  const index = tabs.value.findIndex(tab => tab.key === activeTab.value)
  const button = buttons[index]
  if (!button) {
    pillReady.value = false
    return
  }
  pillWidth.value = button.offsetWidth
  pillOffset.value = button.offsetLeft
  pillReady.value = true
}

function scrollActiveFilterIntoView() {
  const scroller = filterScrollRef.value
  if (!scroller) return
  const active = scroller.querySelector<HTMLButtonElement>('[data-filter].is-active')
  if (!active) return

  const scrollerRect = scroller.getBoundingClientRect()
  const activeRect = active.getBoundingClientRect()
  const padding = 8

  if (activeRect.left < scrollerRect.left + padding) {
    scroller.scrollBy({ left: activeRect.left - scrollerRect.left - padding, behavior: 'smooth' })
  }
  else if (activeRect.right > scrollerRect.right - padding) {
    scroller.scrollBy({ left: activeRect.right - scrollerRect.right + padding, behavior: 'smooth' })
  }
}

let resizeObserver: ResizeObserver | null = null
/** Avoid re-navigating the same deep-link target on every reactive tick. */
const deepLinkHandled = ref<number | null>(null)

onMounted(() => {
  orders.loadAgentWorkspace()
  void nextTick(updatePill)
  if (typeof ResizeObserver !== 'undefined' && segmentRef.value) {
    resizeObserver = new ResizeObserver(() => updatePill())
    resizeObserver.observe(segmentRef.value)
  }
})

onBeforeUnmount(() => resizeObserver?.disconnect())

watch([activeTab, tabs], () => void nextTick(updatePill))
watch(offerFilter, () => void nextTick(scrollActiveFilterIntoView))

// Deep-link `/offers?order=` → open the matching detail page.
watch(
  [() => orders.availableOrders, () => orders.myOffers, () => props.focusOrderId, () => orders.isLoadingAgent],
  () => {
    if (!props.focusOrderId || orders.isLoadingAgent) return
    if (deepLinkHandled.value === props.focusOrderId) return

    const mine = orders.myOffers.find(o => o.order.id === props.focusOrderId)
    if (mine) {
      deepLinkHandled.value = props.focusOrderId
      router.replace(ROUTES.offerDetail(mine.id))
      return
    }

    const open = orders.availableOrders.find(o => o.id === props.focusOrderId)
    if (open) {
      deepLinkHandled.value = props.focusOrderId
      router.replace(ROUTES.offerOpportunity(open.id))
      return
    }

    // Workspace loaded but order not found — fall back to highlighting in-list.
    if (orders.workspaceLoaded) {
      deepLinkHandled.value = props.focusOrderId
      activeTab.value = 'orders'
      void nextTick(() => {
        document
          .getElementById(`agent-order-${props.focusOrderId}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
    }
  },
  { immediate: true },
)
</script>

<template>
  <div class="flex flex-col gap-5">
    <!-- Primary: new orders vs my offers -->
    <div
      ref="segmentRef"
      class="offers-segment glass-segment flex rounded-[1.15rem] p-1"
    >
      <span
        class="glass-segment-active offers-segment__pill"
        :class="!pillReady && 'no-anim'"
        :style="{
          width: `${pillWidth}px`,
          transform: `translateX(${pillOffset}px)`,
          opacity: pillReady ? 1 : 0,
        }"
      />
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        data-tab
        class="pressable relative z-10 flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-[0.85rem] px-2 py-2.5 text-[13px] font-semibold leading-none transition-colors"
        :class="activeTab === tab.key ? 'text-foreground' : 'text-muted-foreground'"
        @click="activeTab = tab.key"
      >
        <span class="truncate">{{ tab.label }}</span>
        <span
          class="offers-segment__count"
          :class="activeTab === tab.key
            ? 'offers-segment__count--active'
            : 'offers-segment__count--idle'"
        >
          {{ tab.count }}
        </span>
      </button>
    </div>

    <!-- ===================== Tab 1: New orders ===================== -->
    <template v-if="activeTab === 'orders'">
      <OrderRouteTabs
        v-model="requestRoute"
        :tender-locked="false"
      />

      <template v-if="orders.isLoadingAgent && orders.availableOrders.length === 0">
        <div class="flex flex-col gap-4">
          <Skeleton
            v-for="n in 2"
            :key="n"
            class="h-[140px] w-full rounded-[1.35rem]"
          />
        </div>
      </template>

      <GlassCard
        v-else-if="availableOrders.length === 0"
        padding="none"
        class="overflow-hidden"
      >
        <EmptyState
          :icon="Inbox"
          :title="locale.t.agent.noOpenOrders"
          :description="locale.t.agent.noOpenOrdersBody"
        />
      </GlassCard>

      <div
        v-else
        class="flex flex-col gap-4"
      >
        <AgentOrderItem
          v-for="order in availableOrders"
          :key="order.id"
          :order="order"
          :highlight="order.id === focusOrderId"
        />
      </div>
    </template>

    <!-- ===================== Tab 2: My offers ===================== -->
    <template v-else>
      <template v-if="orders.isLoadingAgent && orders.myOffers.length === 0">
        <div class="flex flex-col gap-4">
          <Skeleton
            v-for="n in 2"
            :key="n"
            class="h-[140px] w-full rounded-[1.35rem]"
          />
        </div>
      </template>

      <GlassCard
        v-else-if="myOffers.length === 0"
        padding="none"
        class="overflow-hidden"
      >
        <EmptyState
          :icon="MessageSquareDashed"
          :title="locale.t.agent.noOffersYet"
          :description="locale.t.agent.noOffersYetBody"
        />
      </GlassCard>

      <div
        v-else
        class="flex flex-col gap-4"
      >
        <!-- Status filter chips -->
        <div
          ref="filterScrollRef"
          class="offers-filters overflow-x-auto py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div class="flex w-max gap-2">
            <button
              v-for="filter in offerFilters"
              :key="filter.key"
              type="button"
              data-filter
              class="offers-filter pressable shrink-0"
              :class="offerFilter === filter.key && 'is-active'"
              @click="offerFilter = filter.key"
            >
              <span>{{ filter.label }}</span>
              <span class="offers-filter__count">{{ filter.count }}</span>
            </button>
          </div>
        </div>

        <div
          v-if="filteredOffers.length === 0"
          class="px-1 py-8 text-center text-sm text-muted-foreground"
        >
          {{ locale.t.agent.noOffersInFilter }}
        </div>

        <div
          v-else
          class="flex flex-col gap-4"
        >
          <AgentOfferItem
            v-for="offer in filteredOffers"
            :key="offer.id"
            :offer="offer"
            :highlight="offer.order.id === focusOrderId"
          />
        </div>
      </div>
    </template>

    <p
      v-if="orders.error"
      class="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
    >
      {{ orders.error }}
    </p>
  </div>
</template>
