<script setup lang="ts">
import { BadgeCheck, Bell, Clock, Menu, ShieldAlert, Star, TrendingUp } from '@lucide/vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Avatar from '@/core/ui/Avatar.vue'
import LanguageSwitcher from '@/core/ui/LanguageSwitcher.vue'
import { Button } from '@/core/ui/button'
import { useTelegram } from '@/core/composables/useTelegram'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useAgentStore } from '@/modules/agent/stores/agent.store'
import { useOrdersStore } from '@/modules/orders/stores/orders.store'
import { type Banner, fetchBanners } from '@/modules/home/services/banners.service'
import TopRatedAgents from '@/modules/home/components/TopRatedAgents.vue'
import { fullName, isBusinessUser } from '@/modules/auth/types/user'
import { ROUTES } from '@/modules/shell/constants/routes'

const auth = useAuthStore()
const agent = useAgentStore()
const orders = useOrdersStore()
const router = useRouter()
const locale = useLocaleStore()
const { user: telegramUser } = useTelegram()

// Verification prompt shown to providers (agent/designer/seller) who aren't yet
// approved. Clients never see it.
const isProvider = computed(() => (auth.user ? isBusinessUser(auth.user) : false))
const verification = computed<'unverified' | 'pending' | null>(() => {
  if (!isProvider.value || agent.isApproved) return null
  return agent.isPending ? 'pending' : 'unverified'
})

const displayName = computed(() => {
  if (auth.user) return fullName(auth.user) || 'Reklama Bozor'
  if (telegramUser.value?.first_name) return telegramUser.value.first_name
  return 'Reklama Bozor'
})

const ordersCount = computed(() => orders.myOrders.length)

// Rating is shown even before we have a real scoring backend — kept intentionally.
const rating = 88
const ratingStars = 4

const banners = ref<Banner[]>([])

/** Whether real banners are configured; otherwise the branded placeholder shows. */
const hasBanners = computed(() => banners.value.length > 0)

// Banner slider active-dot tracking.
const scroller = ref<HTMLElement | null>(null)
const activeBanner = ref(0)
function onBannerScroll() {
  const el = scroller.value
  if (!el) return
  activeBanner.value = Math.round(el.scrollLeft / el.clientWidth)
}

function openBanner(banner: Banner) {
  // Type-driven redirect: agency → agent profile, product → product detail.
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

  // Fallback to an explicit link when no typed target is set.
  if (!banner.link_url) return
  if (/^https?:\/\//.test(banner.link_url)) {
    window.open(banner.link_url, '_blank', 'noopener')
    return
  }
  void router.push(banner.link_url)
}

async function load() {
  if (auth.isAuthenticated) {
    void orders.loadMyOrders()
    // Load the provider's verification status so the home banner can react.
    if (isProvider.value) void agent.loadProfile()
  }
  try {
    banners.value = await fetchBanners()
  }
  catch {
    // ignore — fall back to placeholder banner slide
  }
}

onMounted(load)
watch(() => auth.isAuthenticated, load)
</script>

<template>
  <div>
    <!-- ===== Dark brand hero ===== -->
    <header class="brand-hero safe-top rounded-b-[2rem] px-5 pb-6 pt-3 text-white">
      <!-- Top row -->
      <div class="flex items-center justify-between">
        <button
          type="button"
          class="flex size-10 items-center justify-center rounded-xl bg-white/10 transition active:scale-95"
          @click="router.push(ROUTES.profile)"
        >
          <Menu class="size-5" />
        </button>

        <div class="flex items-center gap-2">
          <LanguageSwitcher />
          <button
            type="button"
            class="relative flex size-10 items-center justify-center rounded-full bg-white/10 transition active:scale-95"
          >
            <Bell class="size-5" />
            <span class="absolute right-1.5 top-1.5 size-2 rounded-full bg-red-500 ring-2 ring-[#02305C]" />
          </button>
        </div>
      </div>

      <!-- Identity -->
      <div class="mt-3 flex items-center gap-3">
        <Avatar :src="auth.user?.avatar" :name="displayName" size="lg" class="rounded-2xl ring-2 ring-white/30" />
        <div class="min-w-0 flex-1">
          <p class="text-sm text-white/70">
            {{ locale.t.home.welcome }}
          </p>
          <h1 class="truncate text-xl font-bold leading-tight">
            {{ displayName }}
          </h1>
          <p class="mt-0.5 text-xs text-white/70">
            {{ locale.t.home.ordersCountLabel }}: {{ ordersCount }} {{ locale.t.home.unit }}
          </p>
        </div>
      </div>

      <!-- Rating -->
      <div class="mt-3 flex items-center gap-3">
        <div class="flex items-center gap-0.5">
          <Star
            v-for="n in 5"
            :key="n"
            class="size-4"
            :class="n <= ratingStars ? 'fill-amber-400 text-amber-400' : 'text-white/30'"
          />
        </div>
        <span class="inline-flex items-center gap-1 text-sm font-semibold text-emerald-300">
          <TrendingUp class="size-4" />
          {{ locale.t.home.rating }}: {{ rating }}
        </span>
      </div>

      <!-- Banner slider -->
      <div class="mt-5">
        <div
          ref="scroller"
          class="flex snap-x snap-mandatory gap-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          @scroll="onBannerScroll"
        >
          <!-- Real image banners -->
          <template v-if="hasBanners">
            <button
              v-for="banner in banners"
              :key="banner.id"
              type="button"
              class="relative min-w-full snap-center overflow-hidden rounded-2xl bg-gradient-to-br from-white to-sky-100 shadow-sm transition active:scale-[0.99]"
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

          <!-- Branded placeholder when no banners are configured -->
          <div
            v-else
            class="flex min-w-full snap-center items-center gap-3 rounded-2xl bg-gradient-to-br from-white to-sky-100 p-4 text-[#02305C] shadow-sm"
          >
            <img src="/images/logo.png" alt="Reklama Bozor" class="size-10 shrink-0 object-contain">
            <div>
              <p class="text-[11px] font-semibold leading-none text-primary">
                Reklama <span class="italic">Bozor</span>
              </p>
              <p class="mt-1 text-lg font-bold leading-tight">
                Banner Reklama
              </p>
            </div>
          </div>
        </div>
        <div v-if="hasBanners && banners.length > 1" class="mt-3 flex items-center justify-center gap-1.5">
          <span
            v-for="(banner, i) in banners"
            :key="banner.id"
            class="h-1.5 rounded-full transition-all"
            :class="i === activeBanner ? 'w-4 bg-white' : 'w-1.5 bg-white/40'"
          />
        </div>
      </div>
    </header>

    <!-- ===== Body ===== -->
    <section class="space-y-5 px-5 pt-5">
      <!-- Provider verification prompt (action needed) -->
      <div
        v-if="verification === 'unverified'"
        class="space-y-3 rounded-3xl border border-amber-300/70 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10"
      >
        <div class="flex items-start gap-3">
          <div class="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-amber-400/20 text-amber-600 dark:text-amber-400">
            <ShieldAlert class="size-5" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="font-semibold text-amber-900 dark:text-amber-200">
              {{ locale.t.home.verifyTitle }}
            </p>
            <p class="text-sm text-amber-800/80 dark:text-amber-200/70">
              {{ locale.t.home.verifyBody }}
            </p>
          </div>
        </div>
        <Button
          class="mt-1 h-11 w-full justify-center rounded-2xl"
          @click="router.push(ROUTES.profile)"
        >
          <BadgeCheck class="size-4" />
          {{ locale.t.home.verifyButton }}
        </Button>
      </div>

      <!-- Verification pending (awaiting review) -->
      <div
        v-else-if="verification === 'pending'"
        class="flex items-start gap-3 rounded-3xl border border-amber-300/70 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10"
      >
        <div class="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-amber-400/20 text-amber-600 dark:text-amber-400">
          <Clock class="size-5" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="font-semibold text-amber-900 dark:text-amber-200">
            {{ locale.t.home.pendingTitle }}
          </p>
          <p class="text-sm text-amber-800/80 dark:text-amber-200/70">
            {{ locale.t.home.pendingBody }}
          </p>
        </div>
      </div>

      <TopRatedAgents />
    </section>
  </div>
</template>
