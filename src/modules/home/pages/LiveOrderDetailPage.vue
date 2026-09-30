<script setup lang="ts">
import { CalendarDays, Eye, Loader2, MapPin, MessageCircle, MessageSquareQuote, Send, UserRound, Wallet, Zap, FileText } from '@lucide/vue'
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import EmptyState from '@/core/ui/EmptyState.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import { useToast } from '@/core/composables/useToast'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { categoryName } from '@/core/i18n/category-name'
import { formatDateTime } from '@/core/lib/date'
import { formatApproxBudget, formatDeadlineRange } from '@/modules/orders/lib/order-terms'
import { formatOrderRegion } from '@/modules/orders/lib/region-label'
import { getApiErrorMessage } from '@/core/api/api-error'
import { confirmOtklik } from '@/modules/agent/lib/confirm-otklik'
import { ROUTES } from '@/modules/shell/constants/routes'
import OrderHashtagChips from '@/modules/orders/components/OrderHashtagChips.vue'
import OrderAttachments from '@/modules/orders/components/OrderAttachments.vue'
import { fmtSom, passStrings } from '@/modules/agent/lib/pass-i18n'
import { usePassStore } from '@/modules/agent/stores/pass.store'
import { submitOffer } from '@/modules/orders/services/orders.service'
import { fetchShowcaseOrder, type ShowcaseOrder } from '@/modules/home/services/live-orders.service'

const props = defineProps<{ id: string }>()

const locale = useLocaleStore()
const router = useRouter()
const toast = useToast()
const pass = usePassStore()

const order = ref<ShowcaseOrder | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const submitting = ref(false)

const title = computed(() => {
  if (!order.value) return ''
  return order.value.title
    || (order.value.category ? categoryName(order.value.category, locale.locale) : '')
})

const categoryLabel = computed(() =>
  order.value?.category ? categoryName(order.value.category, locale.locale) : null,
)
const isTezkor = computed(() => order.value?.route === 'tezkor')

// One fact per row — the same size and weight, colour tells label from value.
interface InfoRow { key: string, icon: typeof Wallet, label: string, value: string, action?: () => void }

const rows = computed<InfoRow[]>(() => {
  const o = order.value
  if (!o) return []
  const t = locale.t.orders
  const list: InfoRow[] = []

  const budget = formatApproxBudget(o.budget_max, locale.locale)
  if (budget) list.push({ key: 'budget', icon: Wallet, label: t.factBudget, value: budget })

  const range = formatDeadlineRange(o.deadline_from, o.deadline_to, locale.locale)
  if (range) {
    const days = o.deadline_from && o.deadline_to
      ? Math.round((Date.parse(o.deadline_to) - Date.parse(o.deadline_from)) / 86_400_000) + 1
      : 0
    list.push({
      key: 'deadline',
      icon: CalendarDays,
      label: t.factDeadline,
      value: days > 0 ? `${range} · ${days} ${t.form.daysSuffix}` : range,
    })
  }

  const place = formatOrderRegion(o, locale.locale)
  if (place) list.push({ key: 'place', icon: MapPin, label: t.factLocation, value: place })

  if (o.client?.first_name) {
    const clientId = o.client.id
    list.push({
      key: 'client',
      icon: UserRound,
      label: t.showcase.owner,
      value: o.client.first_name,
      action: () => router.push(ROUTES.clientDetail(clientId)),
    })
  }

  list.push({ key: 'views', icon: Eye, label: t.showcase.viewsLabel, value: String(o.views_count ?? 0) })
  list.push({ key: 'offers', icon: MessageSquareQuote, label: t.showcase.offersLabel, value: String(o.offers_count ?? 0) })

  return list
})

// The action dock rides above the footer tab bar: interest, or chat once answered.
const chatId = computed(() => order.value?.my_offer?.chat_id ?? null)
const dockMode = computed<'interest' | 'chat' | null>(() => {
  const o = order.value
  if (!o) return null
  if (o.can_offer && !o.my_offer) return 'interest'
  if (o.my_offer && chatId.value) return 'chat'
  return null
})

// What one otklik costs — shown right above the button (hidden when otklik is free).
const feeLabel = computed(() =>
  pass.otklikFeeSom > 0 ? fmtSom(pass.otklikFeeSom, passStrings(locale.locale).unit) : '',
)

const showFee = computed(() => dockMode.value === 'interest' && feeLabel.value !== '')

// Sit exactly on top of whichever footer is mounted (agent bar or client pill).
const dockBottom = ref(0)

function measureDock() {
  const bar = document.querySelector<HTMLElement>('nav.atb, nav.tab-bar-dock')
  dockBottom.value = bar ? Math.max(0, Math.round(window.innerHeight - bar.getBoundingClientRect().top)) : 0
}

async function loadOrder() {
  loading.value = true
  error.value = null
  try {
    order.value = await fetchShowcaseOrder(Number(props.id))
  }
  catch (e) {
    error.value = getApiErrorMessage(e)
  }
  finally {
    loading.value = false
  }
  await nextTick()
  measureDock()
}

async function sendInterest() {
  if (!order.value || submitting.value) return
  submitting.value = true
  try {
    const offer = await submitOffer(order.value.id, {})
    toast.success(locale.t.orders.showcase.interestSent)

    // The interest is in: open the conversation with the client right away — the chat
    // is where the client confirms the agency and either side can end the talk.
    // `replace` so Back returns to the feed, not to this request.
    if (offer?.chat_id) {
      await router.replace(ROUTES.chatDirect(offer.chat_id))
      return
    }
    if (offer?.id) {
      await router.replace(ROUTES.offerDetail(offer.id))
      return
    }
    await loadOrder()
  }
  catch (e) {
    if (!usePassStore().handleClaimError(e, () => sendInterest())) {
      toast.error(getApiErrorMessage(e) || locale.t.orders.showcase.offerError)
    }
  }
  finally {
    submitting.value = false
  }
}

function onDockClick() {
  if (dockMode.value === 'chat' && chatId.value) {
    void router.push(ROUTES.chatDirect(chatId.value))
    return
  }
  if (!order.value || submitting.value) return
  void confirmOtklik(() => sendInterest())
}

let measureTimer: number | undefined

onMounted(() => {
  void loadOrder()
  void pass.ensureLoaded()
  window.addEventListener('resize', measureDock)
  // The footer animates in with the page — measure again once it has settled.
  measureTimer = window.setTimeout(measureDock, 400)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', measureDock)
  window.clearTimeout(measureTimer)
})
</script>

<template>
  <div :class="dockMode ? 'lod lod--docked' : 'lod'">
    <AppHeader
      :title="locale.t.orders.showcase.detailTitle"
      :subtitle="locale.t.orders.showcase.detailSubtitle"
      show-back
    />

    <section class="lod__body px-5">
      <!-- Loading -->
      <template v-if="loading && !order">
        <Skeleton class="h-24 w-full rounded-3xl" />
        <Skeleton class="h-64 w-full rounded-3xl" />
      </template>

      <template v-else-if="order">
        <!-- Route + service -->
        <div class="flex flex-wrap items-center gap-2">
          <span
            class="lod__chip"
            :class="isTezkor ? 'lod__chip--tezkor' : 'lod__chip--tender'"
          >
            <Zap
              v-if="isTezkor"
              class="size-3.5"
            />
            <FileText
              v-else
              class="size-3.5"
            />
            {{ isTezkor ? locale.t.route.tezkor : locale.t.route.tender }}
          </span>
          <span
            v-if="categoryLabel"
            class="lod__chip lod__chip--cat"
          >{{ categoryLabel }}</span>
        </div>

        <div>
          <h2 class="lod__title">
            {{ title }}
          </h2>
          <p class="lod__meta">
            #{{ order.id }} · {{ formatDateTime(order.created_at) }}
          </p>
          <OrderHashtagChips
            v-if="order.hashtags?.length"
            class="pt-2"
            :hashtags="order.hashtags"
          />
        </div>

        <!-- One fact per row -->
        <div class="lod__card">
          <component
            :is="row.action ? 'button' : 'div'"
            v-for="row in rows"
            :key="row.key"
            class="lod__row"
            :type="row.action ? 'button' : undefined"
            @click="row.action?.()"
          >
            <component
              :is="row.icon"
              class="size-[18px] shrink-0 text-muted-foreground"
            />
            <span class="lod__k">{{ row.label }}</span>
            <span class="lod__v">{{ row.value }}</span>
          </component>
        </div>

        <!-- Description -->
        <div
          v-if="order.description"
          class="lod__card lod__card--text"
        >
          <p class="lod__k">
            {{ locale.t.orders.commentTitle }}
          </p>
          <p class="lod__text">
            {{ order.description }}
          </p>
        </div>

        <!-- Photos (carousel → lightbox) and files -->
        <OrderAttachments
          :files="order.attachment_files"
          hide-title
          carousel
        />

        <p
          v-if="error"
          class="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {{ error }}
        </p>
      </template>

      <!-- Not found -->
      <GlassCard
        v-else
        padding="none"
        class="overflow-hidden"
      >
        <EmptyState
          :icon="MessageSquareQuote"
          :title="locale.t.orders.notFoundTitle"
          :description="locale.t.orders.notFoundBody"
        />
      </GlassCard>
    </section>

    <!-- Fixed action bar, right above the footer -->
    <div
      v-if="dockMode"
      class="lod__dock"
      :style="{ bottom: `${dockBottom}px` }"
    >
      <button
        type="button"
        class="lod__cta"
        :class="{ 'lod__cta--priced': showFee }"
        :disabled="submitting"
        @click="onDockClick"
      >
        <span class="lod__cta-label">
          <Loader2
            v-if="submitting"
            class="size-[18px] animate-spin"
          />
          <MessageCircle
            v-else-if="dockMode === 'chat'"
            class="size-[18px]"
          />
          <Send
            v-else
            class="size-[18px]"
          />
          {{ dockMode === 'chat' ? locale.t.orders.showcase.chatWithClient : locale.t.orders.showcase.sendInterest }}
        </span>
        <span
          v-if="showFee"
          class="lod__cta-fee"
          :aria-label="`${locale.t.orders.showcase.interestPrice}: ${feeLabel}`"
        >{{ feeLabel }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.lod--docked { padding-bottom: 6rem; }
.lod__body { display: flex; flex-direction: column; gap: 14px; }
.lod__chip { display: inline-flex; align-items: center; gap: 6px; min-height: 30px; padding: 0 12px; border-radius: 999px; font-size: 12.5px; font-weight: 700; }
.lod__chip--tezkor { background: color-mix(in srgb, var(--rb-cta) 14%, var(--card)); color: #9a3a0a; }
.lod__chip--tender { background: var(--secondary); color: var(--foreground); }
.lod__chip--cat { background: color-mix(in oklab, var(--primary) 12%, transparent); color: var(--primary); }
.lod__title { margin: 0; font-family: var(--rb-font-display); font-size: 22px; font-weight: 700; letter-spacing: -0.015em; line-height: 1.2; color: var(--foreground); }
.lod__meta { margin: 6px 0 0; font-size: 13px; color: var(--muted-foreground); font-variant-numeric: tabular-nums; }

.lod__card { padding: 4px 16px; border-radius: 22px; background: var(--card); }
.lod__card--text { padding: 14px 16px; }
.lod__row {
  display: flex; align-items: center; gap: 10px; width: 100%; min-height: 44px; padding: 0; border: 0; background: none;
  text-align: left; font-family: inherit; font-size: 14px; font-weight: 500; line-height: 1;
}
button.lod__row { cursor: pointer; }
button.lod__row:active { opacity: 0.6; }
.lod__row + .lod__row { border-top: 1px solid var(--border); }
.lod__k { flex: 1; min-width: 0; margin: 0; font-size: 14px; font-weight: 500; color: var(--muted-foreground); }
.lod__v { max-width: 62%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: right; font-size: 14px; font-weight: 500; color: var(--foreground); font-variant-numeric: tabular-nums; }
.lod__text { margin: 8px 0 0; font-size: 14px; font-weight: 500; line-height: 1.5; color: var(--foreground); white-space: pre-line; }

.lod__dock {
  position: fixed; left: 50%; z-index: 39; width: 100%; max-width: 32rem; transform: translateX(-50%);
  padding: 14px 20px 12px; border-radius: 28px 28px 0 0; background: var(--card);
  box-shadow: 0 -10px 30px -18px rgba(15, 23, 42, 0.3);
}
.lod__cta {
  display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; min-height: 52px; border: 0; border-radius: 999px;
  background: linear-gradient(180deg, color-mix(in oklab, var(--primary) 88%, white), var(--primary));
  color: var(--primary-foreground); font-size: 16px; font-weight: 700; cursor: pointer;
  box-shadow: 0 10px 20px -10px color-mix(in oklab, var(--primary) 70%, transparent);
}
.lod__cta-label { display: inline-flex; align-items: center; gap: 8px; }
/* Price lives inside the button: label centred, price as a soft pill on the right. */
.lod__cta--priced { justify-content: space-between; padding: 0 8px 0 22px; }
.lod__cta-fee {
  display: inline-flex; align-items: center; min-height: 36px; padding: 0 14px; border-radius: 999px;
  background: rgba(255, 255, 255, 0.2); font-size: 14px; font-weight: 700; font-variant-numeric: tabular-nums;
}
.lod__cta:disabled { opacity: 0.6; }
.lod__cta:active { transform: scale(0.98); }
</style>
