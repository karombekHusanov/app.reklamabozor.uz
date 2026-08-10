<script setup lang="ts">
import {
  Building2,
  ClipboardList,
  Gavel,
  Handshake,
  Loader2,
  Map,
  MessageCircle,
  MessagesSquare,
  Palette,
  Radio,
} from '@lucide/vue'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Autoplay from 'embla-carousel-autoplay'
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/core/ui/carousel'
import { usePullToRefresh } from '@/core/composables/usePullToRefresh'
import { openExternalLink } from '@/core/lib/telegram-init'
import { useTelegram } from '@/core/composables/useTelegram'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useHomeStore } from '@/modules/home/stores/home.store'
import { trackBannerClick, trackBannerView, type Banner } from '@/modules/home/services/banners.service'
import HomePageSkeleton from '@/modules/home/components/HomePageSkeleton.vue'
import HomeTopBar from '@/modules/home/components/HomeTopBar.vue'
import HomeActionDock, { type HomeActionItem } from '@/modules/home/components/HomeActionDock.vue'
import LiveOrdersCarousel from '@/modules/home/components/LiveOrdersCarousel.vue'
import TopRatedAgents from '@/modules/home/components/TopRatedAgents.vue'
import { fetchMyRating } from '@/modules/orders/services/orders.service'
import { fullName, isBusinessUser } from '@/modules/auth/types/user'
import type { RatingInfo } from '@/modules/orders/types/order'
import { ROUTES } from '@/modules/shell/constants/routes'

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

const isProviderView = computed(() =>
  Boolean(auth.user && isBusinessUser(auth.user) && home.providerApproved),
)

const myRating = ref<RatingInfo | null>(null)

async function loadIdentityRating() {
  if (!auth.isAuthenticated || !auth.user) {
    myRating.value = null
    return
  }
  try {
    myRating.value = await fetchMyRating(auth.user.role)
  }
  catch {
    myRating.value = null
  }
}

/**
 * Personal dock below banner (auth only):
 * - Offers → /offers (approved provider)
 * - Orders → /orders
 * - Chats → /chat/threads
 */
const dockActions = computed((): HomeActionItem[] => {
  if (!auth.isAuthenticated) return []

  const items: HomeActionItem[] = []

  if (isProviderView.value) {
    items.push({
      key: 'offers',
      label: locale.t.home.actionOffers,
      description: locale.t.home.actionOffersDesc,
      count: home.offersPending > 0 ? home.offersPending : undefined,
      icon: Handshake,
      tone: 'amber',
      pulse: home.offersPending > 0,
    })
  }

  items.push(
    {
      key: 'orders',
      label: locale.t.home.actionOrders,
      description: locale.t.home.actionOrdersDesc,
      count: home.myOrdersCount > 0 ? home.myOrdersCount : undefined,
      icon: ClipboardList,
      tone: 'sky',
    },
    {
      key: 'chats',
      label: locale.t.home.actionChats,
      description: locale.t.home.actionChatsDesc,
      count: home.unreadChats > 0 ? home.unreadChats : undefined,
      icon: MessageCircle,
      tone: 'violet',
      pulse: home.unreadChats > 0,
    },
  )

  return items
})

/**
 * Marketplace explore tiles (below banner).
 */
const exploreActions = computed((): HomeActionItem[] => [
  {
    key: 'live-orders',
    label: locale.t.home.liveOrdersTitle,
    description: locale.t.home.liveOrdersHint,
    count: home.newLiveOrdersCount > 0 ? home.newLiveOrdersCount : undefined,
    icon: Radio,
    tone: 'emerald',
    pulse: home.newLiveOrdersCount > 0,
  },
  {
    key: 'tender',
    label: locale.t.tender.title,
    description: locale.t.tender.subtitle,
    icon: Gavel,
    tone: 'amber',
    tag: locale.t.tender.comingSoonBadge,
  },
  {
    key: 'chat',
    label: locale.t.home.globalChat,
    description: locale.t.chat.global.entryBody,
    count: home.unreadGlobal > 0 ? home.unreadGlobal : undefined,
    icon: MessagesSquare,
    tone: 'violet',
    pulse: home.unreadGlobal > 0,
  },
  {
    key: 'map',
    label: locale.t.home.viewMap,
    description: locale.t.home.viewMapHint,
    icon: Map,
    tone: 'teal',
  },
  {
    key: 'designers',
    label: locale.t.designers.title,
    description: locale.t.designers.subtitle,
    icon: Palette,
    tone: 'sky',
  },
  {
    key: 'agencies',
    label: locale.t.home.agencies,
    description: locale.t.home.browseProvidersHint,
    icon: Building2,
    tone: 'indigo',
  },
])

const actionRoutes: Record<string, string> = {
  offers: ROUTES.offers,
  orders: ROUTES.orders,
  chats: ROUTES.chatThreads,
  'live-orders': ROUTES.liveOrders,
  tender: ROUTES.tender,
  chat: ROUTES.chat,
  map: ROUTES.map,
  designers: ROUTES.designers,
  agencies: ROUTES.agencies,
}

function onAction(key: string) {
  const to = actionRoutes[key]
  if (to) navigate(to)
}

const hasBanners = computed(() => home.banners.length > 0)
const showSkeleton = computed(() => !home.hasLoaded && (home.isLoading || auth.isLoading))
const providersLoading = computed(() => !home.hasLoaded && home.isLoading)

const activeBanner = ref(0)

const BANNER_AUTOPLAY_MS = 4500
const bannerAutoplay = Autoplay({
  delay: BANNER_AUTOPLAY_MS,
  stopOnInteraction: false,
  stopOnMouseEnter: true,
})

/** One full-width slide at a time; loop so autoplay keeps animating. */
const bannerCarouselOpts = {
  loop: true,
  align: 'start' as const,
  duration: 25,
}

const bannerCarouselPlugins = computed(() =>
  home.banners.length > 1 ? [bannerAutoplay] : [],
)

const seenBanners = new Set<number>()

function recordBannerImpression(index: number) {
  const banner = home.banners[index]
  if (!banner || seenBanners.has(banner.id)) return
  seenBanners.add(banner.id)
  trackBannerView(banner.id)
}

function onBannerCarouselInit(api: CarouselApi) {
  if (!api) return

  const syncActive = () => {
    activeBanner.value = api.selectedScrollSnap()
    recordBannerImpression(activeBanner.value)
  }

  api.on('select', syncActive)
  api.on('reInit', syncActive)
  syncActive()
}

const { pullDistance, isPulling } = usePullToRefresh({
  onRefresh: async () => {
    haptic('light')
    await home.refresh()
  },
})

const refreshLabel = computed(() =>
  isPulling.value || home.isRefreshing
    ? locale.t.home.refreshing
    : locale.t.home.pullToRefresh,
)

function navigate(to: string) {
  haptic('light')
  void router.push(to)
}

function openBanner(banner: Banner) {
  haptic('light')
  trackBannerClick(banner.id)
  if (banner.target_id) {
    if (banner.type === 'agent') {
      void router.push(`/agents/${banner.target_id}`)
      return
    }
    if (banner.type === 'product') {
      void router.push(`/products/${banner.target_id}`)
      return
    }
  }
  if (!banner.link_url) return
  if (/^https?:\/\//i.test(banner.link_url)) {
    openExternalLink(banner.link_url)
    return
  }
  void router.push(banner.link_url)
}

/** Badge-only poll — never re-fetch showcase / chat lists from Home. */
const BADGE_POLL_MS = 15_000
let badgePollTimer: ReturnType<typeof setInterval> | null = null

function refreshBadges() {
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
  void loadIdentityRating()
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
  myRating.value = null
  void home.load()
  void loadIdentityRating()
  startBadgePoll()
})

watch(
  () => auth.user?.role,
  () => {
    void loadIdentityRating()
    if (auth.isAuthenticated) {
      void home.loadActivity(true)
    }
  },
)
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

    <HomeTopBar
      :display-name="displayName"
      :avatar-src="avatarSrc"
      :is-authenticated="auth.isAuthenticated"
      :notification-count="home.notificationCount"
      :active-role="auth.user?.role"
      :rating="myRating"
      :is-provider="isProviderView"
      :offers-count="home.offersPending"
      :chats-unread="home.unreadChats"
      @profile="navigate(ROUTES.profile)"
      @notifications="navigate(ROUTES.notifications)"
      @navigate="navigate"
    />

    <div
      v-if="hasBanners"
      class="home-banner-carousel px-5 pt-3"
    >
      <Carousel
        class="home-banner-carousel__viewport relative overflow-hidden rounded-[1.35rem]"
        :opts="bannerCarouselOpts"
        :plugins="bannerCarouselPlugins"
        @init-api="onBannerCarouselInit"
      >
        <CarouselContent class="!ml-0">
          <CarouselItem
            v-for="banner in home.banners"
            :key="banner.id"
            class="!basis-full !pl-0"
          >
            <button
              type="button"
              class="pressable relative w-full overflow-hidden border border-white/70 shadow-[0_10px_28px_-16px_rgba(11,107,203,0.35)]"
              :class="!banner.image && 'bg-muted'"
              :style="banner.image ? { backgroundImage: `url(${banner.image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined"
              :aria-label="banner.title ?? locale.t.home.bannerAd"
              @click="openBanner(banner)"
            >
              <div
                class="min-h-[154px]"
                aria-hidden="true"
              />
            </button>
          </CarouselItem>
        </CarouselContent>

        <div
          v-if="home.banners.length > 1"
          class="home-banner-carousel__dots"
          aria-hidden="true"
        >
          <span
            v-for="(banner, i) in home.banners"
            :key="banner.id"
            class="home-banner-carousel__dot"
            :class="i === activeBanner && 'home-banner-carousel__dot--active'"
          />
        </div>
      </Carousel>
    </div>

    <HomeActionDock
      :actions="dockActions"
      aria-label="Orders and chats"
      @action="onAction"
    />

    <HomeActionDock
      layout="grid"
      :actions="exploreActions"
      :aria-label="locale.t.home.quickAction"
      @action="onAction"
    />

    <section class="home-stack overflow-x-hidden px-5">
      <LiveOrdersCarousel />
    </section>

    <section class="home-stack px-5">
      <TopRatedAgents
        :title="locale.t.home.topAgencies"
        :agents="home.topAgents"
        :view-all-route="ROUTES.agencies"
        :loading="providersLoading"
      />
    </section>

    <section class="home-stack px-5 pb-2">
      <TopRatedAgents
        :title="locale.t.home.topDesigners"
        :agents="home.topDesigners"
        :view-all-route="ROUTES.designers"
        :loading="providersLoading"
      />
    </section>
  </div>
</template>
