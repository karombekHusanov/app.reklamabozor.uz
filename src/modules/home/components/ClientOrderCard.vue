<script setup lang="ts">
import { Check, Eye, FileText, UserRound, Zap } from '@lucide/vue'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { ROUTES } from '@/modules/shell/constants/routes'
import type { Order } from '@/modules/orders/types/order'

/** One of the client's active orders as a big patterned card (Tezkor dark, Tender light). */
const props = defineProps<{ order: Order }>()

const locale = useLocaleStore()
const router = useRouter()

const isTezkor = computed(() => props.order.route === 'tezkor')
const t = computed(() => locale.t.clientHome)

const agentName = computed(() => {
  const agent = props.order.claim?.agent
  return agent ? [agent.first_name, agent.last_name].filter(Boolean).join(' ') : ''
})

const status = computed(() => {
  if (isTezkor.value && props.order.claim) return [t.value.agentAssigned, agentName.value].filter(Boolean).join(' · ')
  const offers = props.order.offers_count ?? 0
  if (['new', 'offers_sent'].includes(props.order.status)) return offers ? t.value.offers.replace('{count}', String(offers)) : t.value.noOffers
  return locale.t.orders.status[props.order.status] ?? props.order.status
})
const hasNews = computed(() => !isTezkor.value && (props.order.offers_count ?? 0) > 0 && props.order.status === 'offers_sent')

function open() {
  void router.push(`${ROUTES.orders}/${props.order.id}`)
}
</script>

<template>
  <button
    type="button"
    class="coc"
    :class="isTezkor ? 'coc--tezkor' : 'coc--tender'"
    @click="open"
  >
    <span
      class="coc__pattern"
      aria-hidden="true"
    />
    <span class="coc__chip">
      <Zap
        v-if="isTezkor"
        class="size-3"
      />
      <FileText
        v-else
        class="size-3"
      />
      {{ isTezkor ? locale.t.route.tezkor : locale.t.route.tender }}
    </span>
    <span class="coc__title">{{ order.title }}</span>
    <span class="coc__foot">
      <Check
        v-if="isTezkor && order.claim"
        class="size-4 shrink-0 text-[var(--rb-glow-soft)]"
      />
      <span
        v-else-if="hasNews"
        class="coc__dot"
        aria-hidden="true"
      />
      <span class="coc__status">{{ status }}</span>
      <span
        v-if="!isTezkor"
        class="coc__counts"
      >
        <span><Eye class="size-3.5" />{{ order.views_count ?? 0 }}</span>
        <span><UserRound class="size-3.5" />{{ order.offers_count ?? 0 }}</span>
      </span>
    </span>
  </button>
</template>

<style scoped>
.coc {
  position: relative; display: flex; width: 100%; min-height: 168px; flex-direction: column; align-items: flex-start;
  overflow: hidden; padding: 18px; border: 0; border-radius: 24px; font-family: inherit; text-align: left; cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.coc:active { transform: scale(0.99); }
.coc:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
.coc--tezkor { background: #02305c; color: #fff; }
.coc--tender { background: var(--secondary); color: var(--foreground); }
.coc__pattern { position: absolute; inset: -20px; pointer-events: none; }
.coc--tezkor .coc__pattern { background: repeating-linear-gradient(-55deg, rgba(255, 255, 255, 0.06) 0 12px, transparent 12px 30px); }
.coc--tender .coc__pattern { background: radial-gradient(color-mix(in srgb, var(--foreground) 9%, transparent) 1.6px, transparent 1.7px) 0 0 / 14px 14px; }
.coc__chip { position: relative; display: inline-flex; align-items: center; gap: 4px; padding: 3px 9px; border-radius: var(--rb-r-chip); font-size: 11px; font-weight: 700; }
.coc--tezkor .coc__chip { background: rgba(255, 255, 255, 0.14); }
.coc--tender .coc__chip { background: var(--card); color: var(--secondary-foreground); }
.coc__title {
  position: relative; margin-top: 10px; font-size: 20px; font-weight: 600; line-height: 1.2; letter-spacing: -0.01em;
  display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; line-clamp: 2; overflow: hidden;
}
.coc__foot { position: relative; display: flex; width: 100%; align-items: center; gap: 8px; margin-top: auto; padding-top: 14px; font-size: 13.5px; font-weight: 600; }
.coc__status { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.coc__dot { width: 8px; height: 8px; flex-shrink: 0; border-radius: 999px; background: var(--rb-cta); box-shadow: 0 0 0 3px color-mix(in srgb, var(--rb-cta) 22%, transparent); }
.coc__counts { display: inline-flex; gap: 10px; font-size: 12.5px; color: var(--muted-foreground); }
.coc__counts span { display: inline-flex; align-items: center; gap: 3px; }
</style>
