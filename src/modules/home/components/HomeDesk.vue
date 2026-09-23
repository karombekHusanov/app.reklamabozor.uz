<script setup lang="ts">
import {
  BriefcaseBusiness,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Inbox,
  MessageCircle,
  Radar,
  Send,
  Wallet,
} from '@lucide/vue'
import { computed, ref, watch, type Component } from 'vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { ROUTES } from '@/modules/shell/constants/routes'
import type { UserActivity } from '@/modules/home/services/activity.service'

/**
 * "Your desk" — one glance at everything the user controls (orders, offers,
 * chats, work to accept; provider side: requests, responses, deals, earnings),
 * each tile deep-linking into its screen. Counts come from GET /me/activity.
 */
const props = defineProps<{
  activity: UserActivity | null
  isProvider: boolean
}>()

const emit = defineEmits<{ open: [to: string] }>()

const locale = useLocaleStore()

type Side = 'client' | 'provider'
const side = ref<Side>('client')
watch(() => props.isProvider, (p) => { if (!p) side.value = 'client' })

interface Tile {
  key: string
  icon: Component
  label: string
  count: number
  sub: string
  to: string
  /** Needs the user's attention — gets the coral "new" marker. */
  hot: boolean
}

function fill(tpl: string, n: number) {
  return tpl.replace('{count}', String(n))
}

const tiles = computed<Tile[]>(() => {
  const t = locale.t.landing
  const a = props.activity
  if (side.value === 'provider') {
    const p = a?.provider
    const fresh = a?.live_orders?.count ?? 0
    const pending = p?.offers_pending ?? 0
    const deals = (p?.deals_in_progress ?? 0) + (p?.deals_work_submitted ?? 0)
    return [
      { key: 'opps', icon: Radar, label: t.deskOpportunities, count: fresh, sub: fresh ? fill(t.deskOpportunitiesSub, fresh) : t.deskClear, to: ROUTES.offers, hot: fresh > 0 },
      { key: 'bids', icon: Send, label: t.deskBids, count: pending, sub: fill(t.deskBidsSub, pending), to: `${ROUTES.offers}?tab=offers`, hot: false },
      { key: 'deals', icon: BriefcaseBusiness, label: t.deskDeals, count: deals, sub: fill(t.deskDealsSub, deals), to: `${ROUTES.offers}?tab=offers`, hot: false },
      { key: 'earn', icon: Wallet, label: t.deskEarnings, count: p?.deals_completed ?? 0, sub: t.deskEarningsSub, to: ROUTES.earnings, hot: false },
    ]
  }

  const c = a?.client
  const inProgress = c?.orders_in_progress ?? 0
  const offers = c?.offers_received_pending ?? 0
  const unread = a?.chats?.unread_messages ?? 0
  const review = c?.orders_awaiting_confirmation ?? 0
  return [
    { key: 'orders', icon: ClipboardList, label: t.deskMyOrders, count: c?.orders_total ?? 0, sub: fill(t.deskMyOrdersSub, inProgress), to: ROUTES.orders, hot: false },
    { key: 'offers', icon: Inbox, label: t.deskOffers, count: offers, sub: offers ? fill(t.deskOffersSub, offers) : t.deskClear, to: ROUTES.orders, hot: offers > 0 },
    { key: 'chats', icon: MessageCircle, label: t.deskChats, count: unread, sub: unread ? fill(t.deskChatsSub, unread) : t.deskClear, to: ROUTES.chatThreads, hot: unread > 0 },
    { key: 'review', icon: ClipboardCheck, label: t.deskReview, count: review, sub: review ? fill(t.deskReviewSub, review) : t.deskClear, to: ROUTES.orders, hot: review > 0 },
  ]
})
</script>

<template>
  <section
    class="desk"
    :aria-label="locale.t.landing.deskTitle"
  >
    <div class="desk__head">
      <div>
        <span class="rb-eyebrow">{{ locale.t.landing.deskEyebrow }}</span>
        <h2 class="rb-sec__title">
          {{ locale.t.landing.deskTitle }}
        </h2>
      </div>

      <div
        v-if="isProvider"
        class="desk__seg"
        role="tablist"
      >
        <button
          v-for="s in (['client', 'provider'] as const)"
          :key="s"
          type="button"
          role="tab"
          class="desk__seg-btn"
          :class="{ 'is-on': side === s }"
          :aria-selected="side === s"
          @click="side = s"
        >
          {{ s === 'client' ? locale.t.landing.deskClient : locale.t.landing.deskProvider }}
        </button>
      </div>
    </div>

    <div class="desk__grid">
      <button
        v-for="(tile, i) in tiles"
        :key="`${side}-${tile.key}`"
        type="button"
        class="dtile rb-stagger"
        :class="{ 'dtile--hot': tile.hot }"
        :style="{ '--i': i }"
        @click="emit('open', tile.to)"
      >
        <span class="dtile__top">
          <span
            class="dtile__ic"
            aria-hidden="true"
          ><component
            :is="tile.icon"
            class="size-[19px]"
          /></span>
          <span class="dtile__n">
            <span
              v-if="tile.hot"
              class="dtile__dot"
              aria-hidden="true"
            />
            {{ tile.count }}
          </span>
        </span>
        <span class="dtile__label">{{ tile.label }}</span>
        <span class="dtile__sub">
          {{ tile.sub }}
          <ChevronRight
            class="dtile__chev size-3.5"
            aria-hidden="true"
          />
        </span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.desk__head { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; margin-bottom: 13px; }
.desk__head .rb-sec__title { margin-top: 3px; }

.desk__seg { display: inline-flex; padding: 3px; border-radius: var(--rb-r-chip); background: var(--secondary); flex-shrink: 0; }
.desk__seg-btn {
  min-height: 34px; padding: 0 12px; border: 0; border-radius: var(--rb-r-chip); background: transparent;
  font-family: inherit; font-size: 12px; font-weight: 700; color: var(--muted-foreground); cursor: pointer;
  transition: background var(--rb-dur) var(--rb-ease), color var(--rb-dur) var(--rb-ease);
  -webkit-tap-highlight-color: transparent;
}
.desk__seg-btn.is-on { background: var(--card); color: var(--foreground); box-shadow: var(--rb-elev-1); }
.desk__seg-btn:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }

.desk__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

.dtile {
  display: flex; flex-direction: column; align-items: stretch; gap: 2px; min-height: 118px; padding: 13px;
  text-align: left; font-family: inherit; cursor: pointer;
  background: var(--card); border: 1px solid var(--border); border-radius: var(--rb-r-tile); box-shadow: var(--rb-elev-1);
  transition: transform var(--rb-dur) var(--rb-ease), border-color var(--rb-dur) var(--rb-ease);
  -webkit-tap-highlight-color: transparent;
}
.dtile:active { transform: scale(0.98); }
.dtile:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
.dtile--hot { border-color: color-mix(in srgb, var(--rb-cta) 45%, var(--border)); }

.dtile__top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 10px; }
.dtile__ic { width: 38px; height: 38px; border-radius: 12px; display: grid; place-items: center; background: var(--secondary); color: var(--primary); }
.dtile__n {
  display: inline-flex; align-items: center; gap: 5px;
  font-family: var(--rb-font-display); font-weight: 900; font-size: 24px; line-height: 1; letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums; color: var(--foreground);
}
.dtile__dot { width: 8px; height: 8px; border-radius: 999px; background: var(--rb-cta); box-shadow: 0 0 0 3px color-mix(in srgb, var(--rb-cta) 22%, transparent); }
.dtile__label { font-family: var(--rb-font-display); font-weight: 800; font-size: 14px; letter-spacing: -0.01em; color: var(--foreground); }
.dtile__sub { display: flex; align-items: center; justify-content: space-between; gap: 4px; font-size: 11.5px; color: var(--muted-foreground); }
.dtile__chev { flex-shrink: 0; opacity: 0.6; }
.dtile--hot .dtile__sub { color: var(--foreground); font-weight: 600; }
</style>
