<script setup lang="ts">
import { CalendarDays, Eye, House, Percent, UserRound, Wallet } from '@lucide/vue'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { categoryName } from '@/core/i18n/category-name'
import { regionName } from '@/core/i18n/region-name'
import { localizedDayjs } from '@/core/lib/date'
import { fmtSom, passStrings } from '@/modules/agent/lib/pass-i18n'
import { formatApproxBudget, formatDeadlineRange } from '@/modules/orders/lib/order-terms'
import { ROUTES } from '@/modules/shell/constants/routes'
import type { LiveOrder } from '@/modules/home/services/live-orders.service'

/** One open order in the agent feed (Profi-style card). Opens the showcase detail. */
const props = defineProps<{
  order: LiveOrder
  /** Current otklik fee in so'm; 0 hides the price. */
  feeSom?: number
}>()

const locale = useLocaleStore()
const router = useRouter()

const DAY_MS = 24 * 60 * 60 * 1000

const isTezkor = computed(() => props.order.route === 'tezkor')
const isNew = computed(() => Date.now() - new Date(props.order.created_at).getTime() < DAY_MS)
const date = computed(() => localizedDayjs(locale.locale, props.order.created_at).format('D MMMM'))
const place = computed(() => {
  const o = props.order
  return [o.district, o.region].filter(Boolean).map(r => regionName(r!, locale.locale)).join(', ')
})
const category = computed(() => (props.order.category ? categoryName(props.order.category, locale.locale) : ''))
const budget = computed(() => formatApproxBudget(props.order.budget_max, locale.locale))
const deadline = computed(() =>
  formatDeadlineRange(props.order.deadline_from, props.order.deadline_to, locale.locale),
)
const chip = computed(() => {
  const t = locale.t.agentHome
  const action = t.respond
  return props.feeSom ? `${action} · ${fmtSom(props.feeSom, passStrings(locale.locale).unit)}` : action
})

function open() {
  void router.push(ROUTES.liveOrderDetail(props.order.id))
}
</script>

<template>
  <button
    type="button"
    class="aoc"
    @click="open"
  >
    <span class="aoc__top">
      {{ date }}
      <span
        v-if="isNew"
        class="aoc__new"
        aria-hidden="true"
      />
      <span
        class="aoc__route"
        :class="isTezkor ? 'aoc__route--tezkor' : 'aoc__route--tender'"
      >{{ isTezkor ? locale.t.route.tezkor : locale.t.route.tender }}</span>
    </span>

    <span class="aoc__title">{{ order.title }}</span>
    <span
      v-if="order.description"
      class="aoc__desc"
    >{{ order.description }}</span>

    <span
      v-if="place || category"
      class="aoc__row"
    >
      <House class="size-4 shrink-0" />
      <span class="truncate">{{ [place, category].filter(Boolean).join(' · ') }}</span>
    </span>
    <span
      v-if="budget || deadline"
      class="aoc__facts"
    >
      <span
        v-if="budget"
        class="aoc__fact"
      ><Wallet class="size-3.5 shrink-0" />{{ budget }}</span>
      <span
        v-if="deadline"
        class="aoc__fact"
      ><CalendarDays class="size-3.5 shrink-0" />{{ deadline }}</span>
    </span>
    <span class="aoc__row aoc__row--muted">
      <span class="inline-flex items-center gap-1"><Eye class="size-3.5" />{{ order.views_count }}</span>
      <span class="inline-flex items-center gap-1"><UserRound class="size-3.5" />{{ order.offers_count }}</span>
    </span>

    <span class="aoc__chip">
      <span
        class="aoc__chip-ic"
        aria-hidden="true"
      ><Percent class="size-2.5" /></span>
      {{ chip }}
    </span>
  </button>
</template>

<style scoped>
.aoc {
  display: flex; width: 100%; flex-direction: column; align-items: flex-start; gap: 0; padding: 16px 16px 14px;
  border: 0; border-radius: 22px; background: var(--card); color: var(--foreground);
  font-family: inherit; text-align: left; cursor: pointer;
  transition: transform var(--rb-dur) var(--rb-ease);
  -webkit-tap-highlight-color: transparent;
}
.aoc:active { transform: scale(0.99); }
.aoc:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
.aoc__top { display: flex; width: 100%; align-items: center; gap: 6px; font-size: 12.5px; color: var(--muted-foreground); }
.aoc__new { width: 6px; height: 6px; border-radius: 999px; background: #e5484d; }
.aoc__route { margin-left: auto; padding: 2px 8px; border-radius: var(--rb-r-chip); font-size: 11px; font-weight: 700; }
.aoc__route--tezkor { background: color-mix(in srgb, var(--rb-cta) 14%, var(--card)); color: #9a3a0a; }
.aoc__route--tender { background: var(--secondary); color: var(--secondary-foreground); }
.aoc__title { margin-top: 4px; font-size: 16.5px; font-weight: 600; line-height: 1.3; letter-spacing: -0.01em; }
.aoc__desc {
  margin-top: 4px; font-size: 13.5px; line-height: 1.45; color: var(--foreground); opacity: 0.85;
  display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; line-clamp: 3; overflow: hidden;
}
.aoc__row { display: flex; max-width: 100%; align-items: center; gap: 8px; margin-top: 10px; font-size: 13px; }
.aoc__facts { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
.aoc__fact {
  display: inline-flex; align-items: center; gap: 6px; min-height: 30px; padding: 0 10px; border-radius: 10px;
  background: var(--secondary); color: var(--foreground); font-size: 12.5px; font-weight: 600; font-variant-numeric: tabular-nums;
}
.aoc__fact svg { color: var(--primary); }
.aoc__row--muted { margin-top: 6px; gap: 12px; color: var(--muted-foreground); font-size: 12px; }
.aoc__chip {
  display: inline-flex; align-items: center; gap: 6px; margin-top: 12px; min-height: 32px; padding: 0 10px 0 6px;
  border-radius: 10px; background: var(--background); font-size: 12.5px; font-weight: 600;
}
.aoc__chip-ic { display: grid; place-items: center; width: 18px; height: 18px; border-radius: 999px; background: var(--success); color: #fff; }
</style>
