<script setup lang="ts">
import {
  ArrowRight,
  Bell,
  Building2,
  Loader2,
  Map,
  Menu,
  MessagesSquare,
  Palette,
  Star,
} from '@lucide/vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Avatar from '@/core/ui/Avatar.vue'
import BrandLogo from '@/core/ui/BrandLogo.vue'
import { usePullToRefresh } from '@/core/composables/usePullToRefresh'
import { useTelegram } from '@/core/composables/useTelegram'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useAgentStore } from '@/modules/agent/stores/agent.store'
import { useChatStore } from '@/modules/chat/stores/chat.store'
import { useOrdersStore } from '@/modules/orders/stores/orders.store'
import { useHomeStore } from '@/modules/home/stores/home.store'
import type { Banner } from '@/modules/home/services/banners.service'
import HomePageSkeleton from '@/modules/home/components/HomePageSkeleton.vue'
import TopRatedAgents from '@/modules/home/components/TopRatedAgents.vue'
import { fullName, isBusinessUser } from '@/modules/auth/types/user'
import { ROUTES } from '@/modules/shell/constants/routes'

const auth = useAuthStore()
const agent = useAgentStore()
const chat = useChatStore()
const orders = useOrdersStore()
const home = useHomeStore()
const router = useRouter()
const locale = useLocaleStore()
const { user: telegramUser, haptic } = useTelegram()

const isProvider = computed(() => (auth.user ? isBusinessUser(auth.user) : false))
const isApprovedProvider = computed(() => isProvider.value && agent.isApproved)

const displayName = computed(() => {
  if (auth.user) return fullName(auth.user) || 'Reklama Bozor'
  if (telegramUser.value?.first_name) return telegramUser.value.first_name
  return locale.t.home.guest
})

const ordersCount = computed(() => orders.myOrders.length)
const activeOrdersCount = computed(() =>
  orders.myOrders.filter(o => !['completed', 'cancelled'].includes(o.status)).length,
)

const completion = computed(() => agent.profile?.completion_percent ?? 0)

/** Placeholder rating derived from profile completeness (no scoring backend yet). */
const ratingDisplay = computed(() => (4.5 + (completion.value / 100) * 0.5).toFixed(1))

const hasUnread = computed(() => chat.chats.some(item => item.unread_count > 0))
const hasBanners = computed(() => home.banners.length > 0)
const showSkeleton = computed(() => !home.hasLoaded && (home.isLoading || auth.isLoading))

const quickLinks = computed(() => [
  {
    key: 'chat',
    to: ROUTES.chat,
    label: locale.t.home.globalChat,
    hint: locale.t.chat.subtitle,
    icon: MessagesSquare,
    tone: 'quick-link-tile--sky',
  },
  {
    key: 'map',
    to: ROUTES.map,
    label: locale.t.home.viewMap,
    hint: locale.t.home.viewMapHint,
    icon: Map,
    tone: 'quick-link-tile--indigo',
  },
  {
    key: 'designers',
    to: ROUTES.designers,
    label: locale.t.designers.title,
    hint: locale.t.designers.subtitle,
    icon: Palette,
    tone: 'quick-link-tile--violet',
  },
  {
    key: 'agencies',
    to: ROUTES.marketplace,
    label: locale.t.home.agencies,
    hint: locale.t.home.browseProvidersHint,
    icon: Building2,
    tone: 'quick-link-tile--teal',
  },
])

const scroller = ref<HTMLElement | null>(null)
const activeBanner = ref(0)

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

function onBannerScroll() {
  const el = scroller.value
  if (!el) return
  activeBanner.value = Math.round(el.scrollLeft / el.clientWidth)
}

function navigate(to: string) {
  haptic('light')
  void router.push(to)
}

function openBanner(banner: Banner) {
  haptic('light')
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
  if (/^https?:\/\//.test(banner.link_url)) {
    window.open(banner.link_url, '_blank', 'noopener')
    return
  }
  void router.push(banner.link_url)
}

onMounted(() => {
  void home.load()
})

watch(() => auth.isAuthenticated, (authed, wasAuthed) => {
  if (authed === wasAuthed) return
  home.reset()
  void home.load()
})

watch(
  () => agent.isApproved,
  (approved) => {
    if (approved && auth.isAuthenticated) {
      void orders.loadAgentWorkspace(true)
    }
  },
)
</script>

<template>
  <HomePageSkeleton v-if="showSkeleton" />

  <div v-else class="overflow-x-hidden pb-2">
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

    <!-- Top bar: menu · brand · notifications -->
    <header class="safe-top flex items-center justify-between gap-3 px-5 pt-3">
      <button
        type="button"
        class="pressable home-icon-btn"
        :aria-label="locale.t.home.menuProfile"
        @click="navigate(ROUTES.profile)"
      >
        <Menu class="size-5" />
      </button>

      <BrandLogo size="sm" />

      <button
        type="button"
        class="pressable home-icon-btn relative"
        :aria-label="locale.t.home.notificationsButton"
        @click="navigate(ROUTES.chat)"
      >
        <Bell class="size-5" />
        <span
          v-if="hasUnread"
          class="absolute right-2.5 top-2.5 size-2 rounded-full bg-destructive"
          aria-hidden="true"
        />
      </button>
    </header>

    <!-- Profile card -->
    <section class="px-5 pt-4">
      <div class="home-card p-4">
        <div class="flex items-start gap-3.5">
          <button type="button" class="pressable shrink-0" @click="navigate(ROUTES.profile)">
            <Avatar
              :src="auth.user?.avatar"
              :name="displayName"
              size="lg"
              class="ring-4 ring-background"
            />
          </button>
          <div class="min-w-0 flex-1">
            <p class="text-xs font-medium text-muted-foreground">
              {{ locale.t.home.welcome }}!
            </p>
            <h1 class="mt-1 line-clamp-2 text-lg font-extrabold leading-tight tracking-tight text-foreground">
              {{ auth.isAuthenticated ? displayName : locale.t.home.guest }}
            </h1>
            <p v-if="auth.user?.phone" class="mt-1 truncate text-xs text-muted-foreground">
              {{ auth.user.phone }}
            </p>
          </div>
        </div>

        <div class="mt-4 space-y-3">
          <div class="min-w-0 rounded-2xl bg-muted/55 p-3">
            <!-- Approved provider: rating & profile completeness -->
            <template v-if="isApprovedProvider">
              <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                {{ locale.t.home.ratingPortfolio }}
              </p>
              <div class="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span class="flex items-center gap-0.5 rounded-full bg-card px-2.5 py-1 shadow-sm">
                  <Star
                    v-for="n in 5"
                    :key="n"
                    class="size-3 fill-amber-400 text-amber-400"
                  />
                  <span class="ml-1 text-sm font-bold text-foreground">{{ ratingDisplay }}</span>
                </span>
                <span class="rounded-full bg-card px-2.5 py-1 text-xs font-semibold text-muted-foreground shadow-sm">
                  {{ completion }}% {{ locale.t.home.profileComplete }}
                </span>
              </div>
            </template>

            <!-- Client: orders summary -->
            <template v-else-if="auth.isAuthenticated">
              <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                {{ locale.t.home.ordersCountLabel }}
              </p>
              <p class="mt-2 text-sm leading-relaxed text-foreground">
                <template v-if="ordersCount > 0">
                  {{ locale.t.home.clientStatusLine.replace('{count}', String(ordersCount)) }}
                  <template v-if="activeOrdersCount > 0">
                    · {{ locale.t.home.clientStatusActive.replace('{count}', String(activeOrdersCount)) }}
                  </template>
                </template>
                <template v-else>
                  {{ locale.t.home.noOrdersYet }}
                </template>
              </p>
            </template>

            <!-- Guest -->
            <template v-else>
              <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                {{ locale.t.home.signInTitle }}
              </p>
              <p class="mt-2 text-sm leading-relaxed text-foreground">
                {{ locale.t.home.signInBody }}
              </p>
            </template>
          </div>

          <button
            type="button"
            class="btn-accent inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-full px-4 text-sm font-semibold"
            @click="navigate(ROUTES.profile)"
          >
            {{ auth.isAuthenticated ? locale.t.home.goToProfile : locale.t.home.signInCta }}
            <ArrowRight class="size-4" />
          </button>
        </div>
      </div>
    </section>

    <!-- Banner slider -->
    <div v-if="hasBanners" class="overflow-x-hidden pt-4">
      <div
        ref="scroller"
        class="flex snap-x snap-mandatory gap-3.5 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        @scroll="onBannerScroll"
      >
        <div
          v-for="banner in home.banners"
          :key="banner.id"
          class="relative min-w-[calc(100%-4.5rem)] snap-center overflow-hidden rounded-[28px] bg-slate-900 shadow-sm"
          :style="banner.image ? { backgroundImage: `url(${banner.image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined"
        >
          <div
            class="absolute inset-0"
            :class="banner.image ? 'bg-gradient-to-r from-slate-950/82 via-slate-950/52 to-slate-900/20' : 'bg-gradient-to-br from-brand-600 to-brand-teal'"
          />
          <div class="relative flex min-h-[154px] flex-col gap-3 p-3.5">
            <div class="flex items-start gap-2.5">
              <div class="flex min-w-0 flex-1 flex-col">
                <h3 class="line-clamp-2 max-w-[11ch] text-[1.08rem] font-extrabold leading-[1.02] tracking-tight text-white">
                  {{ banner.title ?? locale.t.home.bannerAd }}
                </h3>
                <p v-if="banner.subtitle" class="mt-1.5 line-clamp-2 max-w-[18ch] text-[11px] leading-snug text-white/80">
                  {{ banner.subtitle }}
                </p>
              </div>
            </div>
            <div class="mt-auto">
              <button
                type="button"
                class="btn-accent inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold"
                @click="openBanner(banner)"
              >
                {{ locale.t.home.details }}
                <ArrowRight class="size-3.5" />
              </button>
            </div>
            <div
              v-if="banner.image && !banner.subtitle"
              class="sr-only"
            >
              {{ banner.title ?? locale.t.home.bannerAd }}
            </div>
          </div>
        </div>
      </div>
      <div v-if="home.banners.length > 1" class="mt-2.5 flex items-center justify-center gap-1.5">
        <span
          v-for="(banner, i) in home.banners"
          :key="banner.id"
          class="h-1.5 rounded-full transition-all"
          :class="i === activeBanner ? 'w-4 bg-primary' : 'w-1.5 bg-muted-foreground/30'"
        />
      </div>
    </div>

    <!-- Quick links grid -->
    <section class="grid grid-cols-2 gap-4 px-5 pt-4">
      <button
        v-for="link in quickLinks"
        :key="link.key"
        type="button"
        class="pressable quick-link-tile relative min-h-[148px] overflow-hidden rounded-[28px] p-4 text-left"
        :class="link.tone"
        @click="navigate(link.to)"
      >
        <span class="quick-link-tile__glow" aria-hidden="true" />
        <span class="quick-link-tile__orb" aria-hidden="true" />
        <div class="relative flex h-full flex-col items-start justify-between">
          <span class="quick-link-tile__icon-wrap">
            <component :is="link.icon" class="size-7" />
          </span>
          <div class="w-full">
            <p class="text-[1.02rem] font-bold leading-tight text-slate-900 dark:text-white">
              {{ link.label }}
            </p>
            <p class="mt-1.5 line-clamp-2 max-w-[13ch] text-[11px] leading-snug text-slate-700/90 dark:text-white/72">
              {{ link.hint }}
            </p>
          </div>
        </div>
      </button>
    </section>

    <section class="px-5 pt-4">
      <TopRatedAgents />
    </section>
  </div>
</template>
