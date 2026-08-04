<script setup lang="ts">
import { Inbox, MessageSquareDashed } from '@lucide/vue'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import EmptyState from '@/core/ui/EmptyState.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import { useTelegram } from '@/core/composables/useTelegram'
import { useToast } from '@/core/composables/useToast'
import { useLocaleStore } from '@/core/i18n/locale.store'
import AgentOrderItem from '@/modules/agent/components/AgentOrderItem.vue'
import AgentOfferItem from '@/modules/agent/components/AgentOfferItem.vue'
import { useOrdersStore } from '@/modules/orders/stores/orders.store'
import type { AgentOffer, CreateOfferPayload, ReviewCriterionScore } from '@/modules/orders/types/order'

const locale = useLocaleStore()

const props = defineProps<{
  /** Deep-link target — scroll to and highlight this order once loaded. */
  focusOrderId?: number | null
}>()

// The active tab is shared with the page header so the subtitle can follow it.
const activeTab = defineModel<'orders' | 'offers'>('tab', { default: 'orders' })

const orders = useOrdersStore()
const toast = useToast()
const { haptic } = useTelegram()

type OfferFilter = 'all' | 'pending' | 'active' | 'completed' | 'rejected'
const offerFilter = ref<OfferFilter>('all')

const ACTIVE_DEAL_STATUSES = ['awaiting_payment', 'in_progress', 'work_submitted']

// Tab 1 — open opportunities from /agent/orders, newest first.
const availableOrders = computed(() =>
  [...orders.availableOrders].sort((a, b) => b.id - a.id),
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

let resizeObserver: ResizeObserver | null = null

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

// Deep-link: switch to whichever tab holds the order, then scroll to it.
watch(
  [() => orders.availableOrders, () => orders.myOffers, () => props.focusOrderId],
  async () => {
    if (!props.focusOrderId) return
    const inOffers = orders.myOffers.some(o => o.order.id === props.focusOrderId)
    activeTab.value = inOffers ? 'offers' : 'orders'
    if (inOffers) offerFilter.value = 'all'
    await nextTick()
    const prefix = inOffers ? 'agent-offer' : 'agent-order'
    document
      .getElementById(`${prefix}-${props.focusOrderId}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  },
  { immediate: true },
)

async function handleSubmit(orderId: number, payload: CreateOfferPayload) {
  haptic('light')
  const ok = await orders.sendOffer(orderId, payload)
  if (ok) {
    haptic('medium')
    // A fresh offer moves the order out of the opportunities list — show it.
    activeTab.value = 'offers'
  }
}

async function handleSubmitWork(orderId: number) {
  haptic('light')
  const ok = await orders.submitWork(orderId)
  if (ok) {
    haptic('medium')
    toast.success(locale.t.agent.submitWorkToast)
  }
}

async function handleReviewClient(orderId: number, criteria: ReviewCriterionScore[], comment: string | null) {
  haptic('light')
  const ok = await orders.submitProviderReview(orderId, criteria, comment)
  if (ok) {
    haptic('medium')
    toast.success(locale.t.orders.rateThanks)
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- Tabs: new orders (/agent/orders) vs my offers (/agent/offers). -->
    <div ref="segmentRef" class="glass-segment flex rounded-2xl p-1">
      <span
        class="glass-segment-active"
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
        class="pressable relative z-10 flex-1 rounded-xl py-2 text-sm font-semibold transition-colors"
        :class="activeTab === tab.key ? 'text-foreground' : 'text-muted-foreground'"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
        <span v-if="tab.count > 0" class="ml-1 text-xs font-medium opacity-70">{{ tab.count }}</span>
      </button>
    </div>

    <!-- ===================== Tab 1: New orders ===================== -->
    <template v-if="activeTab === 'orders'">
      <template v-if="orders.isLoadingAgent && orders.availableOrders.length === 0">
        <Skeleton v-for="n in 2" :key="n" class="h-40 w-full rounded-3xl" />
      </template>

      <GlassCard v-else-if="availableOrders.length === 0" padding="none" class="overflow-hidden">
        <EmptyState
          :icon="Inbox"
          :title="locale.t.agent.noOpenOrders"
          :description="locale.t.agent.noOpenOrdersBody"
        />
      </GlassCard>

      <div v-else class="space-y-3">
        <AgentOrderItem
          v-for="order in availableOrders"
          :key="order.id"
          :order="order"
          :submitting="orders.isSubmitting"
          :highlight="order.id === focusOrderId"
          @submit="handleSubmit"
        />
      </div>
    </template>

    <!-- ===================== Tab 2: My offers ===================== -->
    <template v-else>
      <template v-if="orders.isLoadingAgent && orders.myOffers.length === 0">
        <Skeleton v-for="n in 2" :key="n" class="h-32 w-full rounded-3xl" />
      </template>

      <GlassCard v-else-if="myOffers.length === 0" padding="none" class="overflow-hidden">
        <EmptyState
          :icon="MessageSquareDashed"
          :title="locale.t.agent.noOffersYet"
          :description="locale.t.agent.noOffersYetBody"
        />
      </GlassCard>

      <template v-else>
        <!-- Status filter chips. -->
        <div class="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          <button
            v-for="filter in offerFilters"
            :key="filter.key"
            type="button"
            class="pressable shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors"
            :class="offerFilter === filter.key
              ? 'bg-primary text-primary-foreground'
              : 'glass-chip'"
            @click="offerFilter = filter.key"
          >
            {{ filter.label }}
            <span v-if="filter.count > 0" class="ml-1 opacity-70">{{ filter.count }}</span>
          </button>
        </div>

        <div v-if="filteredOffers.length === 0" class="px-1 py-8 text-center text-sm text-muted-foreground">
          {{ locale.t.agent.noOffersInFilter }}
        </div>

        <div v-else class="space-y-3">
          <AgentOfferItem
              v-for="offer in filteredOffers"
              :key="offer.id"
              :offer="offer"
              :submitting="orders.isSubmitting"
              :highlight="offer.order.id === focusOrderId"
              @submit-work="handleSubmitWork"
              @review-client="handleReviewClient"
            />
        </div>
      </template>
    </template>

    <p v-if="orders.error" class="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
      {{ orders.error }}
    </p>
  </div>
</template>
