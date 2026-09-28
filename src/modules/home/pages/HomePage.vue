<script setup lang="ts">
/**
 * Client home (Profi-style): top bar (workspace switch · map · call · bell),
 * greeting + avatar menu, sticky search, assistant card, active orders, top
 * agencies, "learn PRB" tiles and a fixed "tell us about your task" action.
 *
 * Retired sections — components kept in `modules/home/components/` for reuse,
 * intentionally not imported: HomeHero, HomeBillboard, HomeStatCards,
 * HomeFeatureTiles, HomeDesk, HomeSafeDeal, HomeJourney, HomeServiceRail,
 * HomeRoutes, HomeAgencyRail, HomeLiveRequests, HomeProviderZone, HomeSupport.
 */
import { Search, Sparkles, ChevronRight } from '@lucide/vue'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Avatar from '@/core/ui/Avatar.vue'
import BrandLogo from '@/core/ui/BrandLogo.vue'
import { useTelegram } from '@/core/composables/useTelegram'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { fullName } from '@/modules/auth/types/user'
import type { Category } from '@/modules/agent/types/agent'
import ClientAgencyRail from '@/modules/home/components/ClientAgencyRail.vue'
import ClientInfoTiles from '@/modules/home/components/ClientInfoTiles.vue'
import ClientOrderCard from '@/modules/home/components/ClientOrderCard.vue'
import ClientProfileMenu from '@/modules/home/components/ClientProfileMenu.vue'
import { useHomeStore } from '@/modules/home/stores/home.store'
import type { PublicAgent } from '@/modules/marketplace/services/agents.service'
import { fetchCategories } from '@/modules/orders/services/orders.service'
import { useOrdersStore } from '@/modules/orders/stores/orders.store'
import GlobalSearchDrawer from '@/modules/search/components/GlobalSearchDrawer.vue'
import ModeSwitch from '@/modules/shell/components/ModeSwitch.vue'
import TopBarActions from '@/modules/shell/components/TopBarActions.vue'
import { ROUTES } from '@/modules/shell/constants/routes'
import { useModeStore } from '@/modules/shell/stores/mode.store'

const ACTIVE_ORDERS_SHOWN = 3
const BADGE_POLL_MS = 15_000

const auth = useAuthStore()
const home = useHomeStore()
const orders = useOrdersStore()
const mode = useModeStore()
const router = useRouter()
const locale = useLocaleStore()
const { haptic } = useTelegram()

const t = computed(() => locale.t.clientHome)
const name = computed(() => (auth.user ? fullName(auth.user) : ''))
const firstName = computed(() => auth.user?.first_name || name.value)

const greeting = computed(() => {
  const hour = new Date().getHours()
  const key = hour >= 5 && hour < 12 ? 'morning' : hour >= 12 && hour < 18 ? 'afternoon' : 'evening'
  return t.value.greeting[key]
})
const hello = computed(() => (firstName.value ? `${greeting.value}, ${firstName.value}` : greeting.value))

/** Open work only — finished and cancelled orders live on the Orders page. */
const activeOrders = computed(() =>
  orders.myOrders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').slice(0, ACTIVE_ORDERS_SHOWN),
)

const menuOpen = ref(false)
const searchOpen = ref(false)
const categories = ref<Category[]>([])

function go(to: string) {
  haptic('light')
  void router.push(to)
}

function openSearch() {
  haptic('light')
  searchOpen.value = true
}

let poll: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  void home.load()
  if (auth.isAuthenticated) void orders.loadMyOrders(true)
  poll = setInterval(() => {
    if (document.visibilityState === 'visible' && auth.isAuthenticated) void home.loadActivity(true)
  }, BADGE_POLL_MS)
  try { categories.value = (await fetchCategories()).filter(c => c.is_active) }
  catch { categories.value = [] }
})

onUnmounted(() => { if (poll) clearInterval(poll) })
</script>

<template>
  <div class="ch">
    <header class="ch__top brand-hero safe-top">
      <ModeSwitch
        v-if="mode.canUseAgent"
        :badge="home.newLiveOrdersCount"
      />
      <BrandLogo
        v-else
        on-dark
        size="sm"
        class="flex-1"
      />
      <TopBarActions
        show-map
        :notification-count="home.notificationCount"
        @map="go(ROUTES.map)"
        @notifications="go(ROUTES.notifications)"
      />
    </header>

    <div class="ch__sheet">
      <div class="ch__greet">
        <p class="ch__hello">
          {{ hello }}
        </p>
        <button
          v-if="auth.user"
          type="button"
          class="ch__avatar"
          :aria-label="t.profileMenu"
          @click="menuOpen = true"
        >
          <Avatar
            :src="auth.user.avatar"
            :name="name"
            class="size-11 rounded-full"
          />
        </button>
      </div>

      <div class="ch__search">
        <button
          type="button"
          class="ch__field"
          @click="openSearch"
        >
          <span class="flex-1">{{ t.searchPlaceholder }}</span>
          <Search class="size-5" />
        </button>
      </div>

      <div class="ch__body">
        <button
          type="button"
          class="ch__assistant"
          @click="go(ROUTES.assistant)"
        >
          <Sparkles class="size-6 shrink-0 text-[var(--rb-glow-soft)]" />
          <span class="ch__assistant-text">
            <span class="ch__assistant-title">{{ t.assistantTitle }}</span>
            <span class="ch__assistant-sub">{{ t.assistantBody }}</span>
          </span>
          <ChevronRight class="size-5 shrink-0 opacity-70" />
        </button>

        <section
          v-if="activeOrders.length"
          class="ch__orders"
        >
          <div class="ch__head">
            <h2 class="ch__h2">
              {{ t.myOrders }}
            </h2>
            <button
              type="button"
              class="ch__link"
              @click="go(ROUTES.orders)"
            >
              {{ t.all }}
            </button>
          </div>
          <ClientOrderCard
            v-for="order in activeOrders"
            :key="order.id"
            :order="order"
          />
        </section>

        <ClientAgencyRail :agents="home.topAgents" />

        <ClientInfoTiles />
      </div>
    </div>

    <div class="ch__cta-wrap">
      <button
        type="button"
        class="ch__cta"
        @click="go(ROUTES.newOrder)"
      >
        {{ t.cta }}
      </button>
    </div>

    <GlobalSearchDrawer
      v-model:open="searchOpen"
      :categories="categories"
      @provider="(agent: PublicAgent) => router.push(`/agents/${agent.id}`)"
      @service="(category: Category) => router.push(ROUTES.categoryDetail(category.id))"
      @view-all="(query: string) => router.push({ path: ROUTES.agencies, query: { q: query } })"
    />
    <ClientProfileMenu v-model:open="menuOpen" />
  </div>
</template>

<style scoped>
/* The sheet runs to the very bottom: it owns the room under the fixed CTA and
   cancels AppLayout's `pb-6` (hideTabBar pages) so no grey strip shows below. */
.ch { display: flex; flex: 1; min-height: 100%; flex-direction: column; margin-bottom: -1.5rem; }
.ch__top { display: flex; align-items: center; gap: 8px; padding: calc(max(env(safe-area-inset-top), 0.5rem) + 0.5rem) 16px 40px; color: #fff; }
.ch__sheet { position: relative; z-index: 1; flex: 1; margin-top: -26px; padding-bottom: 120px; border-radius: 26px 26px 0 0; background: var(--card); }
.ch__greet { display: flex; align-items: center; gap: 12px; padding: 18px 16px 10px; }
.ch__hello { flex: 1; min-width: 0; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 18px; font-weight: 600; letter-spacing: -0.01em; }
.ch__avatar { flex-shrink: 0; padding: 0; border: 0; border-radius: 999px; background: none; cursor: pointer; box-shadow: 0 0 0 2px var(--card), 0 0 0 3px var(--border); }
.ch__search { position: sticky; top: 0; z-index: 5; padding: 6px 16px 10px; background: var(--card); }
.ch__field {
  display: flex; width: 100%; min-height: 50px; align-items: center; gap: 10px; padding: 0 16px; border: 0; border-radius: 16px;
  background: var(--background); color: var(--muted-foreground); font-family: inherit; font-size: 15px; text-align: left; cursor: pointer;
}
.ch__body { display: flex; flex-direction: column; gap: 22px; padding: 4px 16px 0; }
.ch__assistant {
  display: flex; min-height: 68px; align-items: center; gap: 12px; padding: 12px 16px; border: 0; border-radius: 20px;
  background: #16181d; color: #fff; font-family: inherit; text-align: left; cursor: pointer;
}
.ch__assistant-text { display: flex; flex: 1; min-width: 0; flex-direction: column; gap: 2px; }
.ch__assistant-title { font-size: 15px; font-weight: 700; }
.ch__assistant-sub { font-size: 12.5px; color: #b7c0cc; }
.ch__orders { display: flex; flex-direction: column; gap: 8px; }
.ch__head { display: flex; align-items: center; }
.ch__h2 { flex: 1; margin: 0; font-size: 18px; font-weight: 600; }
.ch__link { min-height: 44px; border: 0; background: none; color: var(--primary); font-family: inherit; font-size: 13.5px; font-weight: 600; cursor: pointer; }
.ch__cta-wrap {
  position: fixed; inset-inline: 0; bottom: 0; z-index: 30; margin: 0 auto; max-width: 32rem;
  padding: 24px 16px max(env(safe-area-inset-bottom), 16px);
  background: linear-gradient(to top, var(--card) 60%, transparent);
}
.ch__cta {
  display: block; width: 100%; min-height: 54px; border: 0; border-radius: 16px; background: #c94f0f; color: #fff;
  font-family: inherit; font-size: 16px; font-weight: 600; box-shadow: 0 14px 26px -12px rgba(201, 79, 15, 0.7); cursor: pointer;
}
.ch__avatar:focus-visible, .ch__field:focus-visible, .ch__assistant:focus-visible, .ch__link:focus-visible, .ch__cta:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
</style>
