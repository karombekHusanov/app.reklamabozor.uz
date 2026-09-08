<script setup lang="ts">
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  Loader2,
  ListPlus,
  Lock,
  MapPinned,
  MessageCircle,
  MessageSquareQuote,
} from '@lucide/vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import Avatar from '@/core/ui/Avatar.vue'
import Badge from '@/core/ui/Badge.vue'
import Drawer from '@/core/ui/Drawer.vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import LocationMap from '@/core/ui/LocationMap.vue'
import EmptyState from '@/core/ui/EmptyState.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import StickyActionBar from '@/core/ui/StickyActionBar.vue'
import { Button } from '@/core/ui/button'
import { useTelegram } from '@/core/composables/useTelegram'
import { useToast } from '@/core/composables/useToast'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { categoryName } from '@/core/i18n/category-name'
import { formatDateTime } from '@/core/lib/date'
import { getApiErrorMessage } from '@/core/api/api-error'
import { ROUTES } from '@/modules/shell/constants/routes'
import CriteriaReviewForm from '@/modules/orders/components/CriteriaReviewForm.vue'
import ReviewDisplay from '@/modules/orders/components/ReviewDisplay.vue'
import OrderAttachments from '@/modules/orders/components/OrderAttachments.vue'
import ContractDownloadCard from '@/modules/orders/components/ContractDownloadCard.vue'
import OrderActsCard from '@/modules/orders/components/OrderActsCard.vue'
import AmendmentsSection from '@/modules/orders/components/AmendmentsSection.vue'
import PricelistBuilder from '@/modules/orders/components/PricelistBuilder.vue'
import ContractAgreementDrawer from '@/modules/orders/components/ContractAgreementDrawer.vue'
import PricelistTable from '@/modules/orders/components/PricelistTable.vue'
import { formatPrice, isInterestOffer, offerStatusVariant, orderStatusVariant } from '@/modules/orders/lib/order-status'
import { formatOrderRegion } from '@/modules/orders/lib/region-label'
import {
  fetchAgentOffer,
  openOfferChat,
  previewAgentContract,
  setOfferPricelist,
} from '@/modules/orders/services/orders.service'
import { useOrdersStore } from '@/modules/orders/stores/orders.store'
import type {
  AgentOfferDetail,
  ContractDocument,
  PricelistItemInput,
  ReviewCriterionScore,
} from '@/modules/orders/types/order'

const props = defineProps<{ id: string }>()

const locale = useLocaleStore()
const router = useRouter()
const toast = useToast()
const { haptic } = useTelegram()
const orders = useOrdersStore()

const offer = ref<AgentOfferDetail | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const chatLoading = ref(false)
const pricelistDrawerOpen = ref(false)
const pricelistSaving = ref(false)
// Contract step: the pricelist is only sent after the agent confirms the
// contract built from it.
const contractDrawerOpen = ref(false)
const contractDoc = ref<ContractDocument | null>(null)
const contractLoading = ref(false)
const contractError = ref<string | null>(null)
const draftPricelist = ref<{ items: PricelistItemInput[], deadlineDays: number } | null>(null)
const orderExpanded = ref(false)

const order = computed(() => offer.value?.order ?? null)
const orderStatus = computed(() => order.value?.status ?? null)

const title = computed(() => {
  if (!order.value) return ''
  return order.value.title
    || (order.value.category ? categoryName(order.value.category, locale.locale) : '')
    || `#${order.value.id}`
})

const deadlineLabel = computed(() => {
  if (order.value?.deadline === 'this_week') return locale.t.orders.deadlineThisWeek
  if (order.value?.deadline === 'today_tomorrow') return locale.t.orders.deadlineTodayTomorrow
  return null
})

const regionLabel = computed(() =>
  order.value ? formatOrderRegion(order.value, locale.locale) : null,
)

const badge = computed(() => {
  if (!offer.value) return null
  if (offer.value.status === 'accepted' && orderStatus.value) {
    return {
      variant: orderStatusVariant(orderStatus.value),
      label: locale.t.orders.status[orderStatus.value],
    }
  }
  return {
    variant: offerStatusVariant(offer.value.status),
    label: locale.t.orders.offerStatus[offer.value.status],
  }
})

const statusNote = computed(() => {
  if (!offer.value) return null
  if (offer.value.status === 'pending') return locale.t.agent.offerPendingNote
  if (offer.value.status === 'rejected') return locale.t.agent.offerRejectedNote
  if (orderStatus.value === 'awaiting_payment') return locale.t.agent.dealAwaitingPayment
  if (offer.value.status === 'accepted' && orderStatus.value === 'cancelled') {
    return locale.t.agent.dealCancelledBeforePay
  }
  if (orderStatus.value === 'work_submitted') return locale.t.agent.workAwaitingClient
  if (orderStatus.value === 'completed' && !canReviewClient.value && !hasProviderReview.value) {
    return locale.t.agent.offerCompletedNote
  }
  return null
})

const statusTone = computed<'neutral' | 'amber' | 'danger'>(() => {
  if (orderStatus.value === 'awaiting_payment') return 'amber'
  if (offer.value?.status === 'rejected') return 'danger'
  if (offer.value?.status === 'accepted' && orderStatus.value === 'cancelled') return 'danger'
  return 'neutral'
})

const isAwaitingPayment = computed(() =>
  offer.value?.status === 'accepted' && orderStatus.value === 'awaiting_payment',
)

const isActiveDeal = computed(() =>
  offer.value?.status === 'accepted'
  && ['in_progress', 'work_submitted', 'completed'].includes(orderStatus.value ?? ''),
)

const isCompleted = computed(() =>
  offer.value?.status === 'accepted' && orderStatus.value === 'completed',
)

const canReviewClient = computed(() =>
  isCompleted.value && !offer.value?.my_review,
)

const hasProviderReview = computed(() => Boolean(offer.value?.my_review))

const offerIsInterest = computed(() =>
  offer.value ? isInterestOffer(offer.value) : false,
)

const pricelistItems = computed(() => offer.value?.items ?? [])
const offerHasItems = computed(() => pricelistItems.value.length > 0)

// The agent can send / revise the pricelist while the bid is pending and the
// order is still open for selection. Once accepted, the pricelist is locked.
const canManagePricelist = computed(() =>
  offer.value?.status === 'pending'
  && ['new', 'offers_sent'].includes(orderStatus.value ?? ''),
)

const chatBlocked = computed(() => Boolean(offer.value?.chat?.blocked))
const showChatButton = computed(() => {
  if (!offer.value) return false
  if (isActiveDeal.value || isAwaitingPayment.value) return true
  if (offer.value.chat?.id) return true
  return offer.value.status === 'pending'
})

const canOpenDirectChat = computed(() =>
  offer.value?.status === 'pending' || isAwaitingPayment.value,
)

const headerSubtitle = computed(() => {
  if (loading.value) return locale.t.agent.offerDetailSubtitle
  if (badge.value) return badge.value.label
  return locale.t.agent.offerDetailSubtitle
})

const descriptionLong = computed(() => (order.value?.description?.length ?? 0) > 160)

async function loadOffer() {
  loading.value = true
  error.value = null
  try {
    offer.value = await fetchAgentOffer(Number(props.id))
  }
  catch (e) {
    offer.value = null
    error.value = getApiErrorMessage(e)
  }
  finally {
    loading.value = false
  }
}

async function handleSubmitWork() {
  if (!order.value || orders.isSubmitting) return
  haptic('light')
  const ok = await orders.submitWork(order.value.id)
  if (ok) {
    haptic('medium')
    toast.success(locale.t.agent.submitWorkToast)
    await loadOffer()
  }
  else if (orders.error) {
    toast.error(orders.error)
  }
}

async function handleReviewClient(criteria: ReviewCriterionScore[], comment: string | null) {
  if (!order.value || orders.isSubmitting) return
  haptic('light')
  const ok = await orders.submitProviderReview(order.value.id, criteria, comment)
  if (ok) {
    haptic('medium')
    toast.success(locale.t.orders.rateThanks)
    await loadOffer()
  }
  else if (orders.error) {
    toast.error(orders.error)
  }
}

async function handleOpenChat() {
  if (!offer.value || chatLoading.value) return

  // Paid / active deals use the order thread; awaiting payment stays on direct chat.
  if (isActiveDeal.value && order.value) {
    router.push(ROUTES.chatOrder(order.value.id))
    return
  }

  if (chatBlocked.value) {
    toast.error(locale.t.agent.chatEndedByClient)
    return
  }

  if (offer.value.chat?.id) {
    router.push(ROUTES.chatDirect(offer.value.chat.id))
    return
  }

  if (!canOpenDirectChat.value) return

  chatLoading.value = true
  haptic('light')
  try {
    const chat = await openOfferChat(offer.value.id)
    haptic('medium')
    router.push(ROUTES.chatDirect(chat.id))
  }
  catch (e) {
    toast.error(getApiErrorMessage(e))
  }
  finally {
    chatLoading.value = false
  }
}

/**
 * Step 1 — the agent finished the pricelist: show the contract built from those
 * exact lines. Nothing is stored until they accept it.
 */
async function handlePricelistReady(payload: { items: PricelistItemInput[], deadlineDays: number }) {
  if (!offer.value || pricelistSaving.value) return

  draftPricelist.value = payload
  contractDoc.value = null
  contractError.value = null
  contractLoading.value = true
  pricelistDrawerOpen.value = false
  contractDrawerOpen.value = true
  haptic('light')

  try {
    contractDoc.value = await previewAgentContract(offer.value.id, payload.items, payload.deadlineDays)
  }
  catch (e) {
    contractError.value = getApiErrorMessage(e)
  }
  finally {
    contractLoading.value = false
  }
}

/** Step 2 — the agent accepted the contract: send the priced offer. */
async function handleAcceptContract() {
  const payload = draftPricelist.value
  if (!offer.value || !payload || pricelistSaving.value) return

  pricelistSaving.value = true
  haptic('light')
  try {
    offer.value = await setOfferPricelist(offer.value.id, payload.items, payload.deadlineDays)
    haptic('medium')
    toast.success(locale.t.orders.contract.agentSentToast)
    contractDrawerOpen.value = false
    draftPricelist.value = null
  }
  catch (e) {
    toast.error(getApiErrorMessage(e))
  }
  finally {
    pricelistSaving.value = false
  }
}

function openClient(clientId: number) {
  router.push(ROUTES.clientDetail(clientId))
}

onMounted(loadOffer)
watch(() => props.id, loadOffer)
</script>

<template>
  <div class="pb-28">
    <AppHeader
      :title="locale.t.agent.offerDetailTitle"
      :subtitle="headerSubtitle"
      show-back
    />

    <section class="space-y-3 px-5">
      <template v-if="loading && !offer">
        <Skeleton class="h-44 w-full rounded-[1.75rem]" />
        <Skeleton class="h-16 w-full rounded-2xl" />
        <Skeleton class="h-36 w-full rounded-[1.75rem]" />
      </template>

      <template v-else-if="offer && order">
        <!-- 1. Hero: your bid (visual anchor) -->
        <div class="offer-hero relative overflow-hidden rounded-[1.75rem] p-5 text-white shadow-[0_12px_32px_rgba(1,75,164,0.28)]">
          <div
            class="offer-hero__glow"
            aria-hidden="true"
          />
          <div class="relative z-10 space-y-4">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
                  {{ locale.t.agent.yourOffer.replace(/:$/, '') }}
                </p>
                <p class="mt-1.5 text-[1.75rem] font-bold leading-none tracking-tight tabular-nums">
                  <template v-if="offerIsInterest">
                    {{ locale.t.orders.interestBadge }}
                  </template>
                  <template v-else>
                    {{ formatPrice(offer.price) }}
                  </template>
                </p>
              </div>
              <Badge
                v-if="badge"
                :variant="badge.variant"
                class="shrink-0 border-white/20 bg-white/15 text-white backdrop-blur-sm"
              >
                {{ badge.label }}
              </Badge>
            </div>

            <p
              v-if="offer.comment"
              class="rounded-2xl bg-white/10 px-3.5 py-3 text-sm leading-relaxed text-white/90 backdrop-blur-[2px]"
            >
              {{ offer.comment }}
            </p>

            <p
              v-if="offer.status === 'pending'"
              class="inline-flex items-center gap-1.5 text-[11px] font-medium text-white/75"
            >
              {{ formatDateTime(offer.created_at) }}
            </p>

            <p
              v-else
              class="inline-flex items-center gap-1.5 text-[11px] font-medium text-white/75"
            >
              <Lock class="size-3.5 shrink-0" />
              {{ locale.t.agent.priceLocked }}
              <span aria-hidden="true">·</span>
              {{ formatDateTime(offer.created_at) }}
            </p>
          </div>
        </div>

        <!-- Pricelist the agent sent (line items) -->
        <div
          v-if="offerHasItems"
          class="space-y-2"
        >
          <p class="px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {{ locale.t.orders.pricelist.title }}
          </p>
          <PricelistTable
            :items="pricelistItems"
            :total="offer.price"
          />
        </div>

        <!-- Service contract (generated once the deal started) -->
        <ContractDownloadCard
          v-if="order.contract"
          :contract="order.contract"
        />

        <!-- Acts closing the deal: the agent gets the commission act too. -->
        <OrderActsCard
          v-if="order.documents?.length"
          :documents="order.documents"
        />

        <!-- Additional agreements (Qo'shimcha kelishuv) on the active deal. -->
        <AmendmentsSection
          v-if="offer.status === 'accepted'"
          :order-id="order.id"
          :is-active="orderStatus === 'in_progress'"
          :initial-items="pricelistItems"
          :initial-deadline-days="offer.deadline_days ?? null"
          :window="order.amendment_window ?? null"
        />

        <!-- 2. Status strip (only when it carries meaning) -->
        <div
          v-if="statusNote"
          class="flex items-start gap-2.5 rounded-2xl px-3.5 py-3 text-sm leading-snug"
          :class="{
            'bg-muted/70 text-muted-foreground dark:bg-white/5': statusTone === 'neutral',
            'bg-amber-500/12 text-amber-800 dark:text-amber-200': statusTone === 'amber',
            'bg-destructive/10 text-destructive': statusTone === 'danger',
          }"
        >
          <Clock class="mt-0.5 size-4 shrink-0 opacity-80" />
          <span>{{ statusNote }}</span>
        </div>

        <!-- 3. Client — compact row, not a heavy card -->
        <button
          v-if="order.client?.id || order.client?.first_name"
          type="button"
          class="pressable flex w-full items-center gap-3 rounded-2xl border border-border/80 bg-card/60 px-3.5 py-3 text-left dark:bg-white/[0.04]"
          :disabled="!order.client?.id"
          @click="order.client?.id && openClient(order.client.id)"
        >
          <Avatar
            :src="order.client?.avatar"
            :name="order.client?.first_name ?? undefined"
            size="md"
            class="rounded-full"
          />
          <span class="min-w-0 flex-1">
            <span class="block truncate text-sm font-semibold text-foreground">
              {{ order.client?.first_name }}
            </span>
            <span class="block text-[11px] text-muted-foreground">
              {{ locale.t.agent.fromLabel }}
            </span>
          </span>
          <ChevronRight
            v-if="order.client?.id"
            class="size-4 shrink-0 text-muted-foreground"
          />
        </button>

        <!-- 4. Order brief — secondary weight -->
        <GlassCard
          padding="sm"
          class="space-y-3"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                {{ locale.t.agent.opportunityDetailTitle }}
              </p>
              <h2 class="rb-font-display mt-1 truncate text-base font-extrabold leading-tight tracking-[-0.01em] text-foreground">
                {{ title }}
              </h2>
            </div>
            <span class="shrink-0 rounded-lg bg-muted px-2 py-1 text-[11px] font-bold tabular-nums text-foreground/70 dark:bg-white/10">
              #{{ order.id }}
            </span>
          </div>

          <div class="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-muted-foreground">
            <span v-if="order.created_at">{{ formatDateTime(order.created_at) }}</span>
            <span
              v-if="deadlineLabel"
              class="inline-flex items-center gap-1 font-medium text-primary"
            >
              <Calendar class="size-3" />
              {{ deadlineLabel }}
            </span>
            <span
              v-if="regionLabel"
              class="inline-flex items-center gap-1 font-medium"
            >
              <MapPinned class="size-3" />
              {{ regionLabel }}
            </span>
            <span class="inline-flex items-center gap-1">
              <Eye class="size-3" />
              {{ order.views_count ?? 0 }}
            </span>
            <span class="inline-flex items-center gap-1">
              <MessageSquareQuote class="size-3" />
              {{ order.offers_count ?? 0 }}
            </span>
          </div>

          <LocationMap
            v-if="order.lat != null && order.lng != null"
            :lat="order.lat"
            :lng="order.lng"
            :label="order.location_label"
          />

          <div v-if="order.description">
            <p
              class="whitespace-pre-line text-sm leading-relaxed text-muted-foreground"
              :class="!orderExpanded && descriptionLong && 'line-clamp-3'"
            >
              {{ order.description }}
            </p>
            <button
              v-if="descriptionLong"
              type="button"
              class="pressable mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-primary"
              @click="orderExpanded = !orderExpanded"
            >
              {{ orderExpanded ? locale.t.agent.showLess : locale.t.agent.showMore }}
              <ChevronDown
                class="size-3.5 transition-transform"
                :class="orderExpanded && 'rotate-180'"
              />
            </button>
          </div>

          <OrderAttachments
            v-if="order.attachment_files?.length"
            class="border-t border-border/60 pt-3"
            :files="order.attachment_files"
            hide-title
          />
        </GlassCard>

        <CriteriaReviewForm
          v-if="canReviewClient"
          target-role="client"
          :title="locale.t.orders.rateClientTitle"
          :body="locale.t.orders.rateClientBody"
          :submitting="orders.isSubmitting"
          @submit="handleReviewClient"
        />

        <ReviewDisplay
          v-else-if="hasProviderReview && offer.my_review"
          :review="offer.my_review"
          :label="locale.t.orders.rateYourReview"
        />

        <p
          v-if="error"
          class="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {{ error }}
        </p>

        <!-- Sticky CTAs: one primary job -->
        <StickyActionBar class="bottom-4">
          <div class="flex flex-col gap-2 rounded-[1.5rem] border border-border/80 bg-background/95 p-2 shadow-[0_8px_28px_rgba(2,48,92,0.1)] backdrop-blur-md dark:bg-card/95">
            <Button
              v-if="isActiveDeal && orderStatus === 'in_progress'"
              class="btn-brand h-12 w-full rounded-2xl text-base font-semibold"
              :disabled="orders.isSubmitting"
              @click="handleSubmitWork"
            >
              <Loader2
                v-if="orders.isSubmitting"
                class="size-4 shrink-0 animate-spin"
              />
              <CheckCircle2
                v-else
                class="size-4 shrink-0"
              />
              {{ locale.t.agent.submitWork }}
            </Button>

            <Button
              v-if="showChatButton"
              class="h-12 w-full rounded-2xl text-base font-semibold"
              :class="!(isActiveDeal && orderStatus === 'in_progress') && 'btn-brand'"
              :variant="(isActiveDeal && orderStatus === 'in_progress') ? 'outline' : 'default'"
              :disabled="chatLoading || chatBlocked"
              @click="handleOpenChat"
            >
              <Loader2
                v-if="chatLoading"
                class="size-4 shrink-0 animate-spin"
              />
              <MessageCircle
                v-else
                class="size-4 shrink-0"
              />
              {{ chatBlocked
                ? locale.t.agent.chatEndedByClient
                : (offer.status === 'pending' || isAwaitingPayment)
                  ? locale.t.agent.chatWithClient
                  : locale.t.chat.openChat }}
            </Button>

            <Button
              v-if="canManagePricelist"
              class="h-12 w-full rounded-2xl text-base font-semibold"
              :class="!offerHasItems && 'btn-brand'"
              :variant="offerHasItems ? 'outline' : 'default'"
              @click="pricelistDrawerOpen = true"
            >
              <ListPlus class="size-4 shrink-0" />
              {{ offerHasItems ? locale.t.agent.pricelistEdit : locale.t.agent.pricelistSend }}
            </Button>
          </div>
        </StickyActionBar>
      </template>

      <GlassCard
        v-else
        padding="none"
        class="overflow-hidden"
      >
        <EmptyState
          :icon="FileText"
          :title="locale.t.agent.offerDetailNotFound"
          :description="error || locale.t.agent.offerDetailNotFoundBody"
        />
      </GlassCard>
    </section>

    <Drawer
      v-model:open="pricelistDrawerOpen"
      :title="locale.t.orders.pricelist.title"
    >
      <PricelistBuilder
        :initial-items="pricelistItems"
        :initial-deadline-days="offer?.deadline_days ?? null"
        :submitting="pricelistSaving"
        :submit-label="locale.t.common.next"
        @submit="handlePricelistReady"
      />
    </Drawer>

    <ContractAgreementDrawer
      v-model:open="contractDrawerOpen"
      party="agent"
      :document="contractDoc"
      :loading="contractLoading"
      :submitting="pricelistSaving"
      :acceptances="offer?.contract ?? null"
      :error="contractError"
      @accept="handleAcceptContract"
    />
  </div>
</template>

<style scoped>
.offer-hero {
  background: var(--brand-gradient);
}

.offer-hero__glow {
  pointer-events: none;
  position: absolute;
  inset: -20% -10% auto auto;
  height: 140%;
  width: 70%;
  background: radial-gradient(circle at 30% 40%, rgba(101, 237, 232, 0.35), transparent 65%);
  opacity: 0.9;
}
</style>
