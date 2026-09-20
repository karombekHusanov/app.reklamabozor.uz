<script setup lang="ts">
import { Loader2 } from '@lucide/vue'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { usePullToRefresh } from '@/core/composables/usePullToRefresh'
import { useTelegram } from '@/core/composables/useTelegram'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useHomeStore } from '@/modules/home/stores/home.store'
import HomePageSkeleton from '@/modules/home/components/HomePageSkeleton.vue'
import HomeHero from '@/modules/home/components/HomeHero.vue'
import HomeTrustRow from '@/modules/home/components/HomeTrustRow.vue'
import HomeBannerCarousel from '@/modules/home/components/HomeBannerCarousel.vue'
import HomeStatCards from '@/modules/home/components/HomeStatCards.vue'
import HomeFeatureTiles from '@/modules/home/components/HomeFeatureTiles.vue'
import HomeSteps from '@/modules/home/components/HomeSteps.vue'
import HomeServiceRail from '@/modules/home/components/HomeServiceRail.vue'
import HomeAgencyRail from '@/modules/home/components/HomeAgencyRail.vue'
import HomeLiveRequests from '@/modules/home/components/HomeLiveRequests.vue'
import HomeProviderInvite from '@/modules/home/components/HomeProviderInvite.vue'
import GlobalSearchDrawer from '@/modules/search/components/GlobalSearchDrawer.vue'
import { fetchLiveStats, type LiveStats } from '@/modules/home/services/live-stats.service'
import { fetchCategories } from '@/modules/orders/services/orders.service'
import { fullName, isBusinessUser } from '@/modules/auth/types/user'
import type { LiveOrder } from '@/modules/home/services/live-orders.service'
import type { Category } from '@/modules/agent/types/agent'
import type { PublicAgent } from '@/modules/marketplace/services/agents.service'
import {
  dismissProviderInvite,
  hydrateProviderInviteDismissed,
  isProviderInviteDismissed,
} from '@/modules/home/lib/provider-invite'
import { ROUTES } from '@/modules/shell/constants/routes'

// MVP: the designers rail is hidden (kept in code, may return).
const SHOW_TOP_DESIGNERS = false

const auth = useAuthStore()
const home = useHomeStore()
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

async function loadLiveStats() {
  try {
    liveStats.value = await fetchLiveStats()
  }
  catch {
    // Non-critical — keep the last value on transient errors.
  }
}

/**
 * "Do you run an agency?" invite. Clients only, hidden for good once dismissed
 * (per user id) — the same offer stays permanently on the profile page.
 */
const inviteDismissed = ref(true)

const showProviderInvite = computed(() => {
  const user = auth.user
  if (!user || inviteDismissed.value) return false
  if (isBusinessUser(user)) return false

  // An application already under review is not a candidate for the invite
  // (`/me/activity` reports it before the agent role is granted on approval).
  return !home.activity?.provider?.has_profile
})

async function syncProviderInvite() {
  const user = auth.user
  if (!user) {
    inviteDismissed.value = true
    return
  }

  inviteDismissed.value = isProviderInviteDismissed(user.id)
    || await hydrateProviderInviteDismissed(user.id)
}

function applyAsProvider() {
  haptic('medium')
  void router.push({ path: ROUTES.profileEdit, query: { as: 'agent' } })
}

function closeProviderInvite() {
  if (auth.user) dismissProviderInvite(auth.user.id)
  inviteDismissed.value = true
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
  void loadLiveStats()
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
  void syncProviderInvite()
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
  void syncProviderInvite()
  startBadgePoll()
})

// A user id can arrive after mount (session restore) — re-check the flag then.
watch(() => auth.user?.id, () => {
  void syncProviderInvite()
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
      @search="onSearch"
      @notifications="navigate(ROUTES.notifications)"
      @profile="navigate(ROUTES.profile)"
    />

    <div class="home-sheet">
      <span
        class="home-sheet__grip"
        aria-hidden="true"
      />

      <div class="home-stats">
        <HomeStatCards :stats="liveStats" />
      </div>

      <div
        v-if="home.platformContact?.phone"
        class="home-block home-gutter"
      >
        <HomeTrustRow :contact="home.platformContact" />
      </div>

      <div class="home-block home-gutter">
        <HomeBannerCarousel :banners="home.banners" />
      </div>

      <div class="home-block home-gutter">
        <HomeFeatureTiles
          :nearby="liveStats?.agencies_total"
          :online="liveStats?.users_online"
          @map="navigate(ROUTES.map)"
          @chat="navigate(ROUTES.chat)"
        />
      </div>

      <div class="home-block home-gutter">
        <HomeSteps />
      </div>

      <div
        v-if="showProviderInvite"
        class="home-block home-gutter"
      >
        <HomeProviderInvite
          @apply="applyAsProvider"
          @dismiss="closeProviderInvite"
        />
      </div>

      <div class="home-block">
        <HomeServiceRail
          :categories="categories"
          @select="onSelectCategory"
          @view-all="navigate(ROUTES.agencies)"
        />
      </div>

      <div class="home-block">
        <HomeAgencyRail
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

      <div class="home-block pb-2">
        <HomeLiveRequests
          :orders="home.liveOrders"
          @open="openLiveOrder"
          @view-all="openLiveOrders"
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
.home-sheet__grip {
  display: block;
  width: 40px;
  height: 4px;
  border-radius: 999px;
  background: var(--border);
  margin: 10px auto 0;
}

.home-stats {
  position: relative;
  z-index: 4;
  padding-inline: var(--home-gutter);
  margin-top: -1.75rem;
}

.home-block {
  padding-top: 1.6rem;
}

/* One page container: hero, sheet sections and rails share this gutter. */
.home-page {
  --home-gutter: 24px;
}

.home-gutter {
  padding-inline: var(--home-gutter);
}
</style>
