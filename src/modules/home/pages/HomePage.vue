<script setup lang="ts">
import { Loader2 } from '@lucide/vue'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { usePullToRefresh } from '@/core/composables/usePullToRefresh'
import { useTelegram } from '@/core/composables/useTelegram'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { useRealtimeStore } from '@/core/stores/realtime.store'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useHomeStore } from '@/modules/home/stores/home.store'
import { useOrderRouteStore } from '@/modules/orders/stores/order-route.store'
import HomePageSkeleton from '@/modules/home/components/HomePageSkeleton.vue'
import HomeHero from '@/modules/home/components/HomeHero.vue'
import HomeStatCards from '@/modules/home/components/HomeStatCards.vue'
import HomeFeatureTiles from '@/modules/home/components/HomeFeatureTiles.vue'
import HomeDesk from '@/modules/home/components/HomeDesk.vue'
import HomeSafeDeal from '@/modules/home/components/HomeSafeDeal.vue'
import HomeJourney from '@/modules/home/components/HomeJourney.vue'
import HomeRoutes from '@/modules/home/components/HomeRoutes.vue'
import HomeProviderZone from '@/modules/home/components/HomeProviderZone.vue'
import AgentInviteCard from '@/modules/agent/components/AgentInviteCard.vue'
import { dismissAgentInvite, isAgentInviteDismissed } from '@/modules/onboarding/lib/agent-intent'
import HomeSupport from '@/modules/home/components/HomeSupport.vue'
import HomeServiceRail from '@/modules/home/components/HomeServiceRail.vue'
import HomeAgencyRail from '@/modules/home/components/HomeAgencyRail.vue'
import HomeLiveRequests from '@/modules/home/components/HomeLiveRequests.vue'
import GlobalSearchDrawer from '@/modules/search/components/GlobalSearchDrawer.vue'
import { fetchLiveStats, type LiveStats } from '@/modules/home/services/live-stats.service'
import { fetchCategories } from '@/modules/orders/services/orders.service'
import { fullName, userHasRole } from '@/modules/auth/types/user'
import type { LiveOrder } from '@/modules/home/services/live-orders.service'
import type { Category } from '@/modules/agent/types/agent'
import type { PublicAgent } from '@/modules/marketplace/services/agents.service'
import { vReveal } from '@/modules/home/lib/reveal'
import { ROUTES } from '@/modules/shell/constants/routes'

// MVP: the designers rail is hidden (kept in code, may return).
const SHOW_TOP_DESIGNERS = false

const auth = useAuthStore()
const home = useHomeStore()
const routeStore = useOrderRouteStore()
const router = useRouter()
const locale = useLocaleStore()
const { user: telegramUser, haptic } = useTelegram()

function resolveHomeDisplayName(raw: string, fallback: string): string {
  const name = raw.trim()
  if (!name || name.length === 1) return fallback
  return name
}

const displayName = computed(() => {
  const fallback = locale.t.home.userFallback
  if (auth.user) {
    return resolveHomeDisplayName(fullName(auth.user), fallback)
  }
  if (telegramUser.value?.first_name) {
    const tgName = [telegramUser.value.first_name, telegramUser.value.last_name]
      .filter(Boolean)
      .join(' ')
      .trim()
    return resolveHomeDisplayName(tgName, fallback)
  }
  return locale.t.home.guest
})

const avatarSrc = computed(() => auth.user?.avatar ?? null)

/** Live platform pulse for the glowing stat cards. */
const liveStats = ref<LiveStats | null>(null)

// With the realtime socket up the backend pushes fresh stats every ~10s.
const realtime = useRealtimeStore()
watch(() => realtime.liveStats, (pushed) => {
  if (pushed) liveStats.value = pushed
})

async function loadLiveStats() {
  try {
    liveStats.value = await fetchLiveStats()
  }
  catch {
    // Non-critical — keep the last value on transient errors.
  }
}

/** Supply-side state for the provider zone (and the desk's provider side). */
const providerState = computed<'none' | 'pending' | 'approved'>(() => {
  if (home.providerApproved) return 'approved'
  return home.activity?.provider?.has_profile ? 'pending' : 'none'
})

/** Invite every non-agent (individual or legal entity) until they hide it. */
const agentReminderHidden = ref(false)
const showAgentReminder = computed(() => {
  const user = auth.user
  if (!user || agentReminderHidden.value) return false
  if (userHasRole(user, 'agent') || userHasRole(user, 'designer')) return false
  return !isAgentInviteDismissed(user.id)
})

function hideAgentReminder() {
  haptic('light')
  if (auth.user) dismissAgentInvite(auth.user.id)
  agentReminderHidden.value = true
}

function applyAsProvider() {
  haptic('medium')
  void router.push({ path: ROUTES.profileEdit, query: { as: 'agent' } })
}

/** Create a request on a chosen route (Tezkor / Tender). */
function startOrder(route: 'tezkor' | 'tender') {
  haptic('medium')
  routeStore.set(route)
  void router.push(ROUTES.newOrder)
}

/** Journey CTA — same gate as the tab bar's Create button. */
function startDefaultOrder() {
  if (routeStore.tenderLocked) startOrder('tezkor')
  else startOrder(routeStore.active)
}

function scrollToSafeDeal() {
  haptic('light')
  document.getElementById('safe-deal')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

/** Public service catalogue for the "Browse by service" rail. */
const categories = ref<Category[]>([])

async function loadCategories() {
  try {
    const list = await fetchCategories()
    categories.value = list
      .filter(c => c.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
  }
  catch {
    categories.value = []
  }
}

const showSkeleton = computed(() => !home.hasLoaded && (home.isLoading || auth.isLoading))
const providersLoading = computed(() => !home.hasLoaded && home.isLoading)

function navigate(to: string) {
  haptic('light')
  void router.push(to)
}

/** The hero field is a trigger — searching happens inside the drawer. */
const searchOpen = ref(false)

function onSearch() {
  haptic('light')
  searchOpen.value = true
}

function openSearchProvider(agent: PublicAgent) {
  void router.push(`/agents/${agent.id}`)
}

function openSearchService(category: Category) {
  void router.push(ROUTES.categoryDetail(category.id))
}

function openSearchResults(query: string) {
  void router.push({ path: ROUTES.agencies, query: { q: query } })
}

function onSelectCategory(category: Category) {
  haptic('light')
  void router.push({
    path: ROUTES.agencies,
    query: { category: String(category.id), type: category.type },
  })
}

function requestTenderAccess() {
  haptic('light')
  void router.push({ path: ROUTES.profile, query: { tender: '1' } })
}

watch(() => routeStore.active, () => {
  if (home.hasLoaded) void home.loadLiveOrders()
})

function openLiveOrder(order: LiveOrder) {
  haptic('light')
  void router.push(ROUTES.liveOrderDetail(order.id))
}

function openLiveOrders() {
  void home.markLiveOrdersSeen()
  navigate(ROUTES.liveOrders)
}

const { pullDistance, isPulling } = usePullToRefresh({
  onRefresh: async () => {
    haptic('light')
    await Promise.all([home.refresh(), loadLiveStats(), loadCategories()])
  },
})

const refreshLabel = computed(() =>
  isPulling.value || home.isRefreshing
    ? locale.t.home.refreshing
    : locale.t.home.pullToRefresh,
)

/** Badge-only poll — never re-fetch showcase / chat lists from Home. */
const BADGE_POLL_MS = 15_000
let badgePollTimer: ReturnType<typeof setInterval> | null = null

function refreshBadges() {
  // Pushed over the socket — only poll when it isn't connected.
  if (!realtime.connected) void loadLiveStats()
  if (auth.isAuthenticated) {
    void home.loadActivity(true)
  }
}

function startBadgePoll() {
  stopBadgePoll()
  badgePollTimer = setInterval(() => {
    if (document.visibilityState === 'visible') refreshBadges()
  }, BADGE_POLL_MS)
}

function stopBadgePoll() {
  if (badgePollTimer != null) {
    clearInterval(badgePollTimer)
    badgePollTimer = null
  }
}

function onVisibilityChange() {
  if (document.visibilityState === 'visible') {
    refreshBadges()
  }
}

onMounted(() => {
  void home.load()
  void loadLiveStats()
  void loadCategories()
  startBadgePoll()
  document.addEventListener('visibilitychange', onVisibilityChange)
})

onUnmounted(() => {
  stopBadgePoll()
  document.removeEventListener('visibilitychange', onVisibilityChange)
})

watch(() => auth.isAuthenticated, (authed, wasAuthed) => {
  if (wasAuthed === undefined || authed === wasAuthed) return
  home.reset()
  void home.load()
  startBadgePoll()
})
</script>

<template>
  <HomePageSkeleton v-if="showSkeleton" />

  <div
    v-else
    class="home-page"
  >
    <div
      class="flex items-center justify-center gap-2 overflow-hidden text-xs font-medium text-muted-foreground transition-[height,opacity] duration-200"
      :class="pullDistance > 0 || isPulling || home.isRefreshing ? 'opacity-100' : 'h-0 opacity-0'"
      :style="{ height: pullDistance > 0 || isPulling || home.isRefreshing ? `${Math.max(pullDistance, isPulling || home.isRefreshing ? 40 : 0)}px` : '0px' }"
    >
      <Loader2
        v-if="isPulling || home.isRefreshing"
        class="size-4 animate-spin text-primary"
      />
      <span>{{ refreshLabel }}</span>
    </div>

    <HomeHero
      :display-name="displayName"
      :avatar-src="avatarSrc"
      :notification-count="home.notificationCount"
      :agent-badge="home.newLiveOrdersCount"
      @search="onSearch"
      @map="navigate(ROUTES.map)"
      @notifications="navigate(ROUTES.notifications)"
      @profile="navigate(ROUTES.profile)"
      @trust="scrollToSafeDeal"
    />

    <div class="home-sheet">
      <div class="home-stats">
        <HomeStatCards
          :stats="liveStats"
          :agents="home.topAgents"
          @open="navigate(ROUTES.agencies)"
        />
      </div>

      <div
        v-if="showAgentReminder"
        class="home-block home-block--tight home-gutter"
      >
        <AgentInviteCard
          @open="applyAsProvider"
          @hide="hideAgentReminder"
        />
      </div>

      <!-- core features: ad map + global chat, right under the fold line -->
      <div class="home-block home-block--tight home-gutter">
        <HomeFeatureTiles
          :nearby="liveStats?.agencies_total"
          :online="liveStats?.users_online ?? undefined"
          @map="navigate(ROUTES.map)"
          @chat="navigate(ROUTES.chat)"
        />
      </div>

      <!-- 1 · what I control -->
      <div
        v-if="auth.isAuthenticated"
        class="home-block home-gutter"
      >
        <HomeDesk
          v-reveal
          :activity="home.activity"
          :is-provider="home.providerApproved"
          @open="navigate"
        />
      </div>

      <!-- 2 · why it is safe -->
      <div class="home-block home-gutter">
        <HomeSafeDeal v-reveal />
      </div>

      <!-- 3 · how it works -->
      <div class="home-block home-gutter">
        <HomeJourney
          v-reveal
          @start="startDefaultOrder"
        />
      </div>

      <!-- 4 · what you can order -->
      <div class="home-block home-gutter">
        <HomeServiceRail
          v-reveal
          :categories="categories"
          @select="onSelectCategory"
          @view-all="navigate(ROUTES.agencies)"
        />
      </div>

      <div class="home-block home-gutter">
        <HomeRoutes
          v-reveal
          :can-create-tender="routeStore.canCreateTender"
          :tender-status="routeStore.tenderStatus"
          @pick="startOrder"
          @request-access="requestTenderAccess"
        />
      </div>

      <!-- 5 · who does the work -->
      <div class="home-block">
        <HomeAgencyRail
          v-reveal
          :title="locale.t.home.topAgencies"
          :agents="home.topAgents"
          :view-all-route="ROUTES.agencies"
          :loading="providersLoading"
        />
      </div>

      <div
        v-if="SHOW_TOP_DESIGNERS"
        class="home-block"
      >
        <HomeAgencyRail
          :title="locale.t.home.topDesigners"
          :agents="home.topDesigners"
          :view-all-route="ROUTES.designers"
          :loading="providersLoading"
        />
      </div>

      <!-- 6 · the market is alive -->
      <div
        v-if="home.liveOrders.length"
        class="home-block"
      >
        <HomeLiveRequests
          v-reveal
          :orders="home.liveOrders"
          @open="openLiveOrder"
          @view-all="openLiveOrders"
        />
      </div>

      <!-- 7 · the other side of the market -->
      <div class="home-block home-gutter">
        <HomeProviderZone
          v-reveal
          :state="providerState"
          :new-count="home.newLiveOrdersCount"
          @apply="applyAsProvider"
          @open="openLiveOrders"
        />
      </div>

      <!-- 8 · a human behind it -->
      <div class="home-block home-gutter pb-2">
        <HomeSupport
          v-reveal
          :contact="home.platformContact"
          @assistant="navigate(ROUTES.assistant)"
          @offer="navigate(ROUTES.publicOffer)"
        />
      </div>
    </div>

    <GlobalSearchDrawer
      v-model:open="searchOpen"
      :categories="categories"
      @provider="openSearchProvider"
      @service="openSearchService"
      @view-all="openSearchResults"
    />
  </div>
</template>

<style scoped>
.home-page {
  display: flex;
  min-height: 100%;
  flex-direction: column;
}

.home-sheet {
  position: relative;
  z-index: 2;
  margin-top: -2rem;
  background: var(--background);
  border-radius: 26px 26px 0 0;
  padding-bottom: 1.5rem;
}

/* The proof strip rides the seam: half on the hero, half on the sheet. */
.home-stats {
  position: relative;
  z-index: 4;
  padding-inline: var(--home-gutter);
  margin-top: -1.6rem;
}

.home-block {
  padding-top: 1.6rem;
}
.home-block--tight {
  padding-top: 1rem;
}

/* One page container: hero, sheet sections and rails share this gutter. */
.home-page {
  --home-gutter: 24px;
}

.home-gutter {
  padding-inline: var(--home-gutter);
}

</style>
