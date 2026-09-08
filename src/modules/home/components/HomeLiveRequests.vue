<script setup lang="ts">
import { useLocaleStore } from '@/core/i18n/locale.store'
import CategoryThumb from '@/modules/orders/components/CategoryThumb.vue'
import type { LiveOrder } from '@/modules/home/services/live-orders.service'

defineProps<{
  orders: LiveOrder[]
}>()

const emit = defineEmits<{
  open: [order: LiveOrder]
  viewAll: []
}>()

const locale = useLocaleStore()

function metaText(order: LiveOrder): string {
  if (order.offers_count > 0) {
    return locale.t.home.liveOrdersOffers.replace('{count}', String(order.offers_count))
  }
  return locale.t.home.liveOrdersViews.replace('{count}', String(order.views_count))
}
</script>

<template>
  <section
    v-if="orders.length"
    aria-label="Live requests"
  >
    <div class="sec-head">
      <div>
        <span class="sec-eyebrow"><span class="live-dot" />{{ locale.t.home.happeningNow }}</span>
        <h2 class="sec-title">
          {{ locale.t.home.liveRequestsTitle }}
        </h2>
      </div>
      <button
        type="button"
        class="sec-link"
        @click="emit('viewAll')"
      >
        {{ locale.t.home.viewAllAgents }} →
      </button>
    </div>

    <div class="feed">
      <div
        v-for="order in orders.slice(0, 4)"
        :key="order.id"
        class="fcard"
      >
        <span class="fcard__ic">
          <CategoryThumb :category="order.category" :size="21" />
        </span>
        <div class="fcard__main">
          <p class="fcard__t">
            {{ order.title }}
          </p>
          <p class="fcard__meta">
            <span
              v-if="order.offers_count === 0"
              class="pill-new"
            >{{ locale.t.home.newLabel }}</span>
            <span v-else>{{ metaText(order) }}</span>
          </p>
        </div>
        <button
          type="button"
          class="fcard__cta"
          @click="emit('open', order)"
        >
          {{ locale.t.home.offerCta }}
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.sec-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 13px; padding-inline: var(--home-gutter, 18px); }
.sec-eyebrow { font-size: 10.5px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted-foreground); display: flex; align-items: center; gap: 6px; margin-bottom: 3px; }
.live-dot { width: 6px; height: 6px; border-radius: 999px; background: var(--success); box-shadow: 0 0 0 0 rgba(18, 183, 106, .6); animation: liveDot 2s ease-out infinite; }
.sec-title { font-family: var(--rb-font-display); font-weight: 800; font-size: 18px; letter-spacing: -0.015em; margin: 0; color: var(--foreground); }
.sec-link { font-size: 12.5px; font-weight: 700; color: var(--primary); background: none; border: 0; cursor: pointer; padding: 0; white-space: nowrap; -webkit-tap-highlight-color: transparent; }

.feed { display: flex; flex-direction: column; gap: 10px; padding-inline: var(--home-gutter, 18px); }
.fcard { display: flex; align-items: center; gap: 12px; padding: 13px; border-radius: 17px; background: var(--card); border: 1px solid var(--border); box-shadow: var(--rb-elev-1); }
.fcard__ic { width: 44px; height: 44px; border-radius: 13px; overflow: hidden; flex-shrink: 0; display: grid; place-items: center; background: color-mix(in srgb, var(--primary) 11%, var(--card)); color: var(--primary); }
.fcard__main { flex: 1; min-width: 0; }
.fcard__t { font-weight: 700; font-size: 13.5px; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--foreground); }
.fcard__meta { margin: 3px 0 0; font-size: 11.5px; color: var(--muted-foreground); display: flex; align-items: center; gap: 6px; }
.pill-new { font-size: 10px; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; color: var(--rb-cta); }
.fcard__cta { flex-shrink: 0; height: 34px; padding: 0 15px; border-radius: 11px; border: 0; background: var(--primary); color: #fff; font-family: inherit; font-weight: 700; font-size: 12.5px; cursor: pointer; -webkit-tap-highlight-color: transparent; transition: transform .12s ease; }
.fcard__cta:active { transform: scale(0.94); }

@keyframes liveDot { 0% { box-shadow: 0 0 0 0 rgba(18, 183, 106, .55); } 70% { box-shadow: 0 0 0 7px rgba(18, 183, 106, 0); } 100% { box-shadow: 0 0 0 0 rgba(18, 183, 106, 0); } }
@media (prefers-reduced-motion: reduce) { .live-dot { animation: none !important; } }
</style>
