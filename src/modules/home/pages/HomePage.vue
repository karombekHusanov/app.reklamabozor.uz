<script setup lang="ts">
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  ClipboardList,
  Clock,
  MapPin,
  ShieldAlert,
  Sparkles,
  Star,
  TrendingUp,
  Users,
} from '@lucide/vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Avatar from '@/core/ui/Avatar.vue'
import { useTelegram } from '@/core/composables/useTelegram'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useAgentStore } from '@/modules/agent/stores/agent.store'
import { useOrdersStore } from '@/modules/orders/stores/orders.store'
import { type Banner, fetchBanners } from '@/modules/home/services/banners.service'
import HomeHeroMenu from '@/modules/home/components/HomeHeroMenu.vue'
import HomePageSkeleton from '@/modules/home/components/HomePageSkeleton.vue'
import TopRatedAgents from '@/modules/home/components/TopRatedAgents.vue'
import { fullName, isBusinessUser } from '@/modules/auth/types/user'
import { ROUTES } from '@/modules/shell/constants/routes'

const auth = useAuthStore()
const agent = useAgentStore()
const orders = useOrdersStore()
const router = useRouter()
const locale = useLocaleStore()
const { user: telegramUser, haptic } = useTelegram()

const isProvider = computed(() => (auth.user ? isBusinessUser(auth.user) : false))
const isApprovedProvider = computed(() => isProvider.value && agent.isApproved)

const verification = computed<'unverified' | 'pending' | null>(() => {
  if (!isProvider.value || agent.isApproved) return null
  return agent.isPending ? 'pending' : 'unverified'
})

const displayName = computed(() => {
  if (auth.user) return fullName(auth.user) || 'Reklama Bozor'
  if (telegramUser.value?.first_name) return telegramUser.value.first_name
  return 'Reklama Bozor'
})

const rating = 88
const ratingStars = 5
const onlineAccountsCount = 460

const showVerifiedBadge = computed(() =>
  auth.isAuthenticated && (isApprovedProvider.value || !isProvider.value),
)

const ordersCount = computed(() => orders.myOrders.length)

const showPrimaryAdvertise = computed(() =>
  !auth.isAuthenticated || (!isProvider.value && auth.isAuthenticated),
)

const showPrimaryOpenOrders = computed(() =>
  auth.isAuthenticated && isApprovedProvider.value,
)

const banners = ref<Banner[]>([])
const hasBanners = computed(() => banners.value.length > 0)
const pageLoading = ref(true)

const scroller = ref<HTMLElement | null>(null)
const activeBanner = ref(0)

function onBannerScroll() {
  const el = scroller.value
  if (!el) return
  activeBanner.value = Math.round(el.scrollLeft / el.clientWidth)
}

function navigate(to: string | { path: string, query?: Record<string, string> }) {
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

async function load() {
  try {
    if (auth.isAuthenticated) {
      await orders.loadMyOrders()
      if (isProvider.value) {
        await agent.loadProfile()
        if (agent.isApproved) await orders.loadAgentWorkspace()
      }
    }
    banners.value = await fetchBanners()
  }
  catch {
    // fall back to placeholder banner
  }
  finally {
    pageLoading.value = false
  }
}

onMounted(load)
watch(() => auth.isAuthenticated, load)
watch(
  () => agent.isApproved,
  (approved) => {
    if (approved && auth.isAuthenticated) void orders.loadAgentWorkspace()
  },
)
</script>

<template>
  <HomePageSkeleton v-if="pageLoading || auth.isLoading" />
  <div v-else class="relative">
    <!-- Hero -->
    <header
      class="rounded-b-[2rem] bg-gradient-to-br from-[#02305C] via-[#014BA4] to-[#0386D9] px-5 pb-8 pt-[max(env(safe-area-inset-top),0.75rem)] text-white"
    >
      <div class="flex items-center justify-between">
        <HomeHeroMenu @navigate="navigate" />
        <button
          type="button"
          class="relative flex items-center gap-2 rounded-full bg-gradient-to-r from-[#65EDE8] to-[#0386D9] px-4 py-2 text-sm font-semibold text-[#02305C] shadow-md transition active:scale-95"
          @click="navigate(ROUTES.chat)"
        >
          <Bell class="size-4" />
          {{ locale.t.home.notificationsButton }}
          <span class="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-red-500 ring-2 ring-[#02305C]" />
        </button>
      </div>

      <p class="mt-4 flex items-center justify-center gap-2 text-sm text-white/90">
        <span class="size-2 shrink-0 rounded-full bg-emerald-400" />
        {{ locale.t.home.onlineAccounts.replace('{count}', String(onlineAccountsCount)) }}
      </p>

      <div class="mt-5 flex items-start gap-4">
        <div class="flex shrink-0 flex-col items-center gap-2.5">
          <button
            type="button"
            class="relative"
            @click="navigate(ROUTES.profile)"
          >
            <Avatar
              :src="auth.user?.avatar"
              :name="displayName"
              size="lg"
              class="rounded-2xl ring-2 ring-white"
            />
            <span
              v-if="showVerifiedBadge"
              class="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-[#0386D9] ring-2 ring-[#02305C]"
            >
              <BadgeCheck class="size-3 text-white" />
            </span>
          </button>
          <div class="flex flex-col items-center gap-1">
            <div class="flex gap-0.5">
              <Star
                v-for="n in 5"
                :key="n"
                class="size-3.5"
                :class="n <= ratingStars ? 'fill-amber-400 text-amber-400' : 'text-white/25'"
              />
            </div>
            <span class="flex items-center gap-1 text-xs font-medium text-emerald-300">
              <TrendingUp class="size-3.5" />
              {{ locale.t.home.rating }}: {{ rating }}
            </span>
          </div>
        </div>

        <button
          type="button"
          class="min-w-0 flex-1 pt-1 text-left transition active:opacity-90"
          @click="navigate(ROUTES.profile)"
        >
          <p class="text-sm text-white/80">
            {{ locale.t.home.welcome }}
          </p>
          <h1 class="mt-1 text-xl font-bold leading-tight">
            {{ displayName }}
          </h1>
          <p class="mt-1.5 text-xs text-white/70">
            {{ locale.t.home.ordersCountLabel }}: {{ ordersCount }} {{ locale.t.home.unit }}
          </p>
        </button>
      </div>
    </header>

    <!-- Banner — directly below hero -->
    <div class="relative z-10 -mt-3 px-5">
      <div
        ref="scroller"
        class="flex snap-x snap-mandatory gap-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        @scroll="onBannerScroll"
      >
        <template v-if="hasBanners">
          <button
            v-for="banner in banners"
            :key="banner.id"
            type="button"
            class="relative min-w-full snap-center overflow-hidden rounded-2xl border border-white/30 shadow-lg transition active:scale-[0.99]"
            @click="openBanner(banner)"
          >
            <img
              v-if="banner.image"
              :src="banner.image"
              :alt="banner.title ?? 'Banner'"
              class="aspect-[16/7] w-full object-cover"
            >
            <div
              v-if="banner.title || banner.subtitle"
              class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 text-left text-white"
            >
              <p v-if="banner.title" class="text-lg font-bold leading-tight">
                {{ banner.title }}
              </p>
              <p v-if="banner.subtitle" class="mt-0.5 text-xs text-white/85">
                {{ banner.subtitle }}
              </p>
            </div>
          </button>
        </template>

        <div
          v-else
          class="flex min-w-full snap-center items-center gap-3 rounded-2xl border border-white/30 bg-gradient-to-br from-white to-sky-100 p-4 shadow-lg"
        >
          <img src="/images/logo.png" alt="Reklama Bozor" class="size-10 shrink-0 object-contain">
          <div>
            <p class="text-[11px] font-semibold leading-none text-[#0386D9]">
              Reklama <span class="italic">Bozor</span>
            </p>
            <p class="mt-1 text-lg font-bold leading-tight text-[#0b1f33]">
              {{ locale.t.home.bannerAd }}
            </p>
          </div>
        </div>
      </div>
      <div v-if="hasBanners && banners.length > 1" class="mt-2.5 flex items-center justify-center gap-1.5">
        <span
          v-for="(banner, i) in banners"
          :key="banner.id"
          class="h-1.5 rounded-full transition-all"
          :class="i === activeBanner ? 'w-4 bg-white' : 'w-1.5 bg-white/40'"
        />
      </div>
    </div>

    <!-- Main content -->
    <section class="space-y-3 px-5 pb-2 pt-4">
      <!-- Guest sign-in CTA -->
      <button
        v-if="!auth.isAuthenticated"
        type="button"
        class="w-full overflow-hidden rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#4f46e5] p-5 text-left text-white shadow-lg transition active:scale-[0.98]"
        @click="navigate(ROUTES.profile)"
      >
        <div class="flex size-14 items-center justify-center rounded-2xl bg-white/20 shadow-md ring-1 ring-white/30">
          <Sparkles class="size-7" />
        </div>
        <h2 class="mt-4 text-lg font-bold">
          {{ locale.t.home.signInTitle }}
        </h2>
        <p class="mt-1.5 text-sm leading-relaxed text-white/80">
          {{ locale.t.home.signInBody }}
        </p>
        <span class="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold">
          {{ locale.t.home.signInCta }}
          <ArrowRight class="size-4" />
        </span>
      </button>

      <!-- Provider verification -->
      <button
        v-else-if="verification === 'unverified'"
        type="button"
        class="w-full overflow-hidden rounded-2xl bg-gradient-to-br from-[#f59e0b] to-[#d97706] p-5 text-left text-white shadow-lg transition active:scale-[0.98]"
        @click="navigate(ROUTES.profile)"
      >
        <div class="flex size-14 items-center justify-center rounded-2xl bg-white/20 shadow-md ring-1 ring-white/30">
          <ShieldAlert class="size-7" />
        </div>
        <h2 class="mt-4 text-lg font-bold">
          {{ locale.t.home.verifyTitle }}
        </h2>
        <p class="mt-1.5 text-sm leading-relaxed text-white/85">
          {{ locale.t.home.verifyBody }}
        </p>
        <span class="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold">
          {{ locale.t.home.verifyButton }}
          <ArrowRight class="size-4" />
        </span>
      </button>

      <!-- Verification pending -->
      <div
        v-else-if="verification === 'pending'"
        class="overflow-hidden rounded-2xl bg-gradient-to-br from-[#64748b] to-[#475569] p-5 text-white shadow-lg"
      >
        <div class="flex size-14 items-center justify-center rounded-2xl bg-white/20 shadow-md ring-1 ring-white/30">
          <Clock class="size-7" />
        </div>
        <h2 class="mt-4 text-lg font-bold">
          {{ locale.t.home.pendingTitle }}
        </h2>
        <p class="mt-1.5 text-sm leading-relaxed text-white/80">
          {{ locale.t.home.pendingBody }}
        </p>
      </div>

      <!-- Client primary CTA -->
      <button
        v-else-if="showPrimaryAdvertise"
        type="button"
        class="w-full overflow-hidden rounded-2xl bg-gradient-to-br from-[#0386D9] to-[#02305C] p-5 text-left text-white shadow-lg transition active:scale-[0.98]"
        @click="navigate(ROUTES.newOrder)"
      >
        <div class="flex size-14 items-center justify-center rounded-2xl bg-white/20 shadow-md ring-1 ring-white/30">
          <ClipboardList class="size-7" />
        </div>
        <h2 class="mt-4 text-lg font-bold">
          {{ locale.t.home.advertiseTitle }}
        </h2>
        <p class="mt-1.5 text-sm leading-relaxed text-white/80">
          {{ locale.t.home.advertiseBody }}
        </p>
        <span class="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold">
          {{ locale.t.home.advertiseCta }}
          <ArrowRight class="size-4" />
        </span>
      </button>

      <!-- Approved provider primary CTA -->
      <button
        v-else-if="showPrimaryOpenOrders"
        type="button"
        class="w-full overflow-hidden rounded-2xl bg-gradient-to-br from-[#0386D9] to-[#02305C] p-5 text-left text-white shadow-lg transition active:scale-[0.98]"
        @click="navigate({ path: ROUTES.profile, query: { tab: 'offers' } })"
      >
        <div class="flex size-14 items-center justify-center rounded-2xl bg-white/20 shadow-md ring-1 ring-white/30">
          <ClipboardList class="size-7" />
        </div>
        <h2 class="mt-4 text-lg font-bold">
          {{ locale.t.home.viewOpenOrders }}
        </h2>
        <p class="mt-1.5 text-sm leading-relaxed text-white/80">
          {{ locale.t.home.openOrdersBody }}
        </p>
        <span class="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold">
          {{ locale.t.home.viewOpenOrders }}
          <ArrowRight class="size-4" />
        </span>
      </button>

      <!-- Secondary quick links -->
      <div class="grid grid-cols-2 gap-3">
        <button
          type="button"
          class="overflow-hidden rounded-2xl bg-gradient-to-br from-[#137AA6] to-[#014BA4] p-4 text-left text-white shadow-lg transition active:scale-[0.98]"
          @click="navigate(ROUTES.marketplace)"
        >
          <div class="flex size-12 items-center justify-center rounded-xl bg-white/25 shadow-md ring-1 ring-white/30">
            <Users class="size-6" />
          </div>
          <p class="mt-3 text-sm font-bold">
            {{ locale.t.home.browseProviders }}
          </p>
          <p class="mt-1 text-xs leading-snug text-white/75">
            {{ locale.t.home.browseProvidersHint }}
          </p>
        </button>
        <button
          type="button"
          class="overflow-hidden rounded-2xl bg-gradient-to-br from-[#65EDE8] to-[#0386D9] p-4 text-left text-white shadow-lg transition active:scale-[0.98]"
          @click="navigate(ROUTES.map)"
        >
          <div class="flex size-12 items-center justify-center rounded-xl bg-white/25 shadow-md ring-1 ring-white/30">
            <MapPin class="size-6" />
          </div>
          <p class="mt-3 text-sm font-bold">
            {{ locale.t.home.viewMap }}
          </p>
          <p class="mt-1 text-xs leading-snug text-white/75">
            {{ locale.t.home.viewMapHint }}
          </p>
        </button>
      </div>

      <TopRatedAgents />
    </section>
  </div>
</template>
