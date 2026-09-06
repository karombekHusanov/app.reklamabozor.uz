<script setup lang="ts">
import { Calendar, CheckCircle2, CreditCard, Eye, Loader2, MapPin, MessageCircle, MessageSquareQuote, MessageSquareText, Paperclip, PartyPopper, Store, Tag, XCircle } from '@lucide/vue'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import LocationMap from '@/core/ui/LocationMap.vue'
import EmptyState from '@/core/ui/EmptyState.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import Drawer from '@/core/ui/Drawer.vue'
import { Button } from '@/core/ui/button'
import { useTelegram } from '@/core/composables/useTelegram'
import { useToast } from '@/core/composables/useToast'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { categoryName } from '@/core/i18n/category-name'
import { formatDateTime } from '@/core/lib/date'
import { ROUTES } from '@/modules/shell/constants/routes'
import OrderStatusBadge from '@/modules/orders/components/OrderStatusBadge.vue'
import OrderHashtagChips from '@/modules/orders/components/OrderHashtagChips.vue'
import OrderAttachments from '@/modules/orders/components/OrderAttachments.vue'
import OfferCard from '@/modules/orders/components/OfferCard.vue'
import ContractDownloadCard from '@/modules/orders/components/ContractDownloadCard.vue'
import AmendmentsSection from '@/modules/orders/components/AmendmentsSection.vue'
import CriteriaReviewForm from '@/modules/orders/components/CriteriaReviewForm.vue'
import ReviewDisplay from '@/modules/orders/components/ReviewDisplay.vue'
import { formatPrice } from '@/modules/orders/lib/order-status'
import { formatOrderRegion } from '@/modules/orders/lib/region-label'
import { useOrdersStore } from '@/modules/orders/stores/orders.store'
import type { ReviewCriterionScore } from '@/modules/orders/types/order'

const props = defineProps<{ id: string }>()

const orders = useOrdersStore()
const locale = useLocaleStore()
const toast = useToast()
const route = useRoute()
const router = useRouter()
const { haptic } = useTelegram()

const order = computed(() => orders.currentOrder)
const offers = computed(() => order.value?.offers ?? [])
// Once the client picks an offer, the losing bids are no longer relevant —
// show only the accepted one so the order detail focuses on the chosen agency.
const acceptedOffer = computed(() => offers.value.find(o => o.status === 'accepted') ?? null)
const visibleOffers = computed(() =>
  acceptedOffer.value ? [acceptedOffer.value] : offers.value,
)
const title = computed(() =>
  order.value?.title
  || (order.value?.category ? categoryName(order.value.category, locale.locale) : '')
  || '',
)

const categoryLabel = computed(() =>
  order.value?.category ? categoryName(order.value.category, locale.locale) : null,
)

const regionLabel = computed(() =>
  order.value ? formatOrderRegion(order.value, locale.locale) : null,
)
// Offer accept + cancel share the same window: order still open for offers
// (`new` / `offers_sent`). Unpaid checkout (`awaiting_payment`) can also cancel.
const selectable = computed(() =>
  order.value ? ['new', 'offers_sent'].includes(order.value.status) : false,
)
// Client picked an offer but hasn't paid yet — show the checkout prompt.
const awaitingPayment = computed(() => order.value?.status === 'awaiting_payment')
const canCancel = computed(() => selectable.value || awaitingPayment.value)
// The agent delivered — the client decides: accept or report a problem.
const awaitingConfirmation = computed(() => order.value?.status === 'work_submitted')

// A deal exists (and so does its chat) from activation onwards.
const hasChat = computed(() =>
  order.value ? ['in_progress', 'work_submitted', 'completed'].includes(order.value.status) : false,
)

// Additional agreements (Qo'shimcha kelishuv): allowed while the deal is active.
const isActiveDeal = computed(() => order.value?.status === 'in_progress')

// Rating: offered once the order completes, until a review is stored.
const hasReview = computed(() => Boolean(order.value?.review))
const canRate = computed(() => order.value?.status === 'completed' && !hasReview.value)
const attachmentFiles = computed(() => order.value?.attachment_files ?? [])

// Determine the provider role for criteria — prefer winning profile type
// (matches backend ReviewService), fall back to category type.
const providerRole = computed<'agent' | 'designer'>(() => {
  const accepted = order.value?.offers?.find(o => o.status === 'accepted')
  const fromProfile = accepted?.agent?.provider_type
  if (fromProfile === 'agent' || fromProfile === 'designer') {
    return fromProfile
  }
  return order.value?.category?.type ?? 'agent'
})

// Confirm in a bottom drawer before killing a live request.
const cancelDrawerOpen = ref(false)

// When the client returns from the checkout page (tab becomes visible again),
// re-check the payment so the order flips to in_progress without a manual reload.
async function recheckPayment() {
  if (document.visibilityState !== 'visible' || !awaitingPayment.value || !order.value) return
  const payment = await orders.refreshPayment(order.value.id)
  if (payment?.status === 'success') {
    haptic('medium')
    toast.success(locale.t.orders.payDoneToast)
  }
}

onMounted(() => {
  orders.loadOrder(Number(props.id))
  document.addEventListener('visibilitychange', recheckPayment)

  // Multicard return_error_url lands here with ?pay=failed.
  if (route.query.pay === 'failed') {
    toast.error(locale.t.orders.payFailedToast)
    const q = { ...route.query }
    delete q.pay
    router.replace({ query: q })
  }
})

onUnmounted(() => document.removeEventListener('visibilitychange', recheckPayment))

async function acceptOffer(offerId: number) {
  haptic('light')
  const ok = await orders.accept(offerId)
  if (ok) haptic('medium')
}

async function payNow() {
  if (!order.value) return
  haptic('light')
  await orders.payForOrder(order.value.id)
}

async function confirmWork() {
  if (!order.value) return
  haptic('light')
  const ok = await orders.confirmCompletion(order.value.id)
  if (ok) {
    haptic('medium')
    toast.success(locale.t.orders.completedToast)
  }
}

async function disputeWork() {
  if (!order.value) return
  haptic('light')
  const ok = await orders.disputeCompletion(order.value.id)
  if (ok) toast.success(locale.t.orders.disputeToast)
}

function openChat() {
  if (!order.value) return
  haptic('light')
  router.push(`/chat/${order.value.id}`)
}

function openCancelDrawer() {
  haptic('light')
  cancelDrawerOpen.value = true
}

async function cancelOrder() {
  if (!order.value || !canCancel.value) return
  haptic('light')
  const ok = await orders.cancelOrder(order.value.id)
  if (ok) {
    haptic('medium')
    cancelDrawerOpen.value = false
    toast.success(locale.t.orders.cancelledToast)
    router.replace(ROUTES.orders)
    return
  }
  toast.error(orders.error ?? locale.t.orders.cancelOrder)
}

async function sendReview(criteria: ReviewCriterionScore[], comment: string | null) {
  if (!order.value) return
  haptic('light')
  const ok = await orders.submitReview(order.value.id, criteria, comment)
  if (ok) {
    haptic('medium')
    toast.success(locale.t.orders.rateThanks)
  }
}
</script>

<template>
  <div>
    <AppHeader
      :title="locale.t.orders.detailTitle"
      :subtitle="locale.t.orders.detailSubtitle"
      show-back
    />

    <section class="space-y-4 px-5">
      <template v-if="orders.isLoading && !order">
        <Skeleton class="h-40 w-full rounded-3xl" />
        <Skeleton class="h-32 w-full rounded-3xl" />
      </template>

      <template v-else-if="order">
        <!-- Summary -->
        <GlassCard padding="none" class="overflow-hidden">
          <!-- Hero: identity, status & key stats -->
          <div class="space-y-3.5 p-5">
            <div class="flex items-center justify-between gap-2">
              <span
                v-if="categoryLabel"
                class="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary"
              >
                <Tag class="size-3.5 shrink-0" />
                <span class="truncate">{{ categoryLabel }}</span>
              </span>
              <span v-else />
              <OrderStatusBadge
                :status="order.status"
                class="shrink-0 !px-3 !py-1"
              />
            </div>

            <div class="min-w-0 space-y-2">
              <div class="flex items-start gap-2.5">
                <span class="mt-0.5 shrink-0 rounded-lg bg-gradient-to-br from-[#0386D9] to-[#014BA4] px-2 py-1 text-xs font-extrabold tabular-nums text-white shadow-sm">
                  #{{ order.id }}
                </span>
                <h1 class="rb-font-display min-w-0 text-xl font-extrabold leading-snug tracking-[-0.02em] text-foreground">
                  {{ title }}
                </h1>
              </div>

              <p class="flex items-center gap-1.5 text-xs font-medium tabular-nums text-muted-foreground">
                <Calendar class="size-3.5 shrink-0 opacity-70" />
                {{ formatDateTime(order.created_at) }}
              </p>

              <OrderHashtagChips
                v-if="order.hashtags?.length"
                class="pt-0.5"
                :hashtags="order.hashtags"
              />

              <p
                v-if="order.target_agent"
                class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
              >
                <Store class="size-3.5" />
                {{ order.target_agent.company_name }}
              </p>
            </div>

            <!-- Key stats -->
            <div class="grid grid-cols-2 gap-2.5">
              <div class="flex items-center gap-2.5 rounded-2xl bg-muted/60 px-3 py-2.5 dark:bg-white/5">
                <span class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-card text-muted-foreground shadow-sm dark:bg-white/10">
                  <Eye class="size-[18px]" />
                </span>
                <div class="min-w-0 leading-tight">
                  <p class="text-base font-extrabold tabular-nums text-foreground">
                    {{ order.views_count ?? 0 }}
                  </p>
                  <p class="truncate text-[11px] font-medium text-muted-foreground">
                    {{ locale.t.orders.viewsSuffix }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-2.5 rounded-2xl bg-primary/8 px-3 py-2.5">
                <span class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <MessageSquareQuote class="size-[18px]" />
                </span>
                <div class="min-w-0 leading-tight">
                  <p class="text-base font-extrabold tabular-nums text-primary">
                    {{ offers.length }}
                  </p>
                  <p class="truncate text-[11px] font-medium text-primary/80">
                    {{ locale.t.orders.offersSuffix }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Detail sections -->
          <div class="space-y-5 border-t border-border/60 p-5">
            <!-- Comment -->
            <section
              v-if="order.description"
              class="space-y-2.5"
            >
              <div class="flex items-center gap-2">
                <span class="flex size-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <MessageSquareText class="size-3.5" />
                </span>
                <h3 class="text-[13px] font-bold text-foreground">
                  {{ locale.t.orders.commentTitle }}
                </h3>
              </div>
              <div class="rounded-2xl border-l-[3px] border-primary/60 bg-muted/40 py-2.5 pl-3.5 pr-3 dark:bg-white/5">
                <p class="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                  {{ order.description }}
                </p>
              </div>
            </section>

            <!-- Attached files -->
            <section
              v-if="attachmentFiles.length"
              class="space-y-2.5"
            >
              <div class="flex items-center gap-2">
                <span class="flex size-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Paperclip class="size-3.5" />
                </span>
                <h3 class="text-[13px] font-bold text-foreground">
                  {{ locale.t.orders.attachedFiles }}
                </h3>
              </div>
              <OrderAttachments
                :files="attachmentFiles"
                hide-title
              />
            </section>

            <!-- Location -->
            <section
              v-if="regionLabel || (order.lat != null && order.lng != null)"
              class="space-y-2.5"
            >
              <div class="flex items-center gap-2">
                <span class="flex size-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <MapPin class="size-3.5" />
                </span>
                <h3 class="text-[13px] font-bold text-foreground">
                  {{ locale.t.orders.locationTitle }}
                </h3>
              </div>
              <p
                v-if="regionLabel"
                class="text-sm font-medium text-foreground/90"
              >
                {{ regionLabel }}
              </p>
              <LocationMap
                v-if="order.lat != null && order.lng != null"
                :lat="order.lat"
                :lng="order.lng"
                :label="order.location_label"
              />
            </section>
          </div>

          <!-- Actions -->
          <div
            v-if="hasChat || canCancel"
            class="flex flex-col gap-2.5 border-t border-border/60 p-5"
          >
            <Button
              v-if="hasChat"
              class="h-12 w-full rounded-2xl"
              @click="openChat"
            >
              <MessageCircle class="size-4" />
              {{ locale.t.chat.openChat }}
            </Button>

            <button
              v-if="canCancel"
              type="button"
              class="pressable mx-auto inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-destructive/10 px-5 text-[13px] font-semibold text-destructive transition active:scale-95 active:bg-destructive/15"
              @click="openCancelDrawer"
            >
              <XCircle class="size-4" />
              {{ locale.t.orders.cancelShort }}
            </button>
          </div>
        </GlassCard>

        <!-- Payment: client picked an offer and must pay to start the deal. -->
        <GlassCard
          v-if="awaitingPayment"
          class="space-y-3"
        >
          <div class="flex items-center gap-2">
            <CreditCard class="size-5 text-primary" />
            <h3 class="text-base font-semibold">
              {{ locale.t.orders.payTitle }}
            </h3>
          </div>
          <p class="text-sm text-muted-foreground">
            {{ locale.t.orders.payBody }}
          </p>
          <Button
            class="h-11 w-full rounded-2xl"
            :disabled="orders.isSubmitting"
            @click="payNow"
          >
            <Loader2
              v-if="orders.isSubmitting"
              class="size-4 animate-spin"
            />
            <CreditCard
              v-else
              class="size-4"
            />
            {{ locale.t.orders.payNow }}
            <span v-if="order.payment"> · {{ formatPrice(order.payment.amount_som) }}</span>
          </Button>
        </GlassCard>

        <!-- Completion handshake: the agent delivered, the client decides. -->
        <GlassCard
          v-if="awaitingConfirmation"
          class="space-y-3"
        >
          <div class="flex items-center gap-2">
            <PartyPopper class="size-5 text-primary" />
            <h3 class="text-base font-semibold">
              {{ locale.t.orders.workReadyTitle }}
            </h3>
          </div>

          <p class="text-sm text-muted-foreground">
            {{ locale.t.orders.workReadyBody }}
          </p>
          <p class="text-xs text-muted-foreground">
            {{ locale.t.orders.workReadyAutoNote }}
          </p>

          <div class="flex gap-2">
            <Button
              class="h-11 flex-1 rounded-2xl"
              :disabled="orders.isSubmitting"
              @click="confirmWork"
            >
              <Loader2
                v-if="orders.isSubmitting"
                class="size-4 animate-spin"
              />
              <CheckCircle2
                v-else
                class="size-4"
              />
              {{ locale.t.orders.acceptWork }}
            </Button>
            <Button
              variant="outline"
              class="h-11 rounded-2xl text-destructive"
              :disabled="orders.isSubmitting"
              @click="disputeWork"
            >
              {{ locale.t.orders.disputeWork }}
            </Button>
          </div>
        </GlassCard>

        <!-- Service contract (generated once the deal started). -->
        <ContractDownloadCard
          v-if="order.contract"
          :contract="order.contract"
        />

        <!-- Additional agreements (Qo'shimcha kelishuv) on the active deal. -->
        <AmendmentsSection
          v-if="acceptedOffer"
          :order-id="order.id"
          :is-active="isActiveDeal"
          :initial-items="acceptedOffer.items ?? []"
          :initial-deadline-days="acceptedOffer.deadline_days ?? null"
        />

        <!-- Rating: once completed, ask the client to rate the agency (criteria-based). -->
        <CriteriaReviewForm
          v-if="canRate"
          :target-role="providerRole"
          :title="locale.t.orders.rateTitle"
          :body="locale.t.orders.rateBody"
          :submitting="orders.isSubmitting"
          @submit="sendReview"
        />

        <!-- Already rated — show client review with criteria breakdown. -->
        <ReviewDisplay
          v-else-if="hasReview && order.review"
          :review="order.review"
          :label="locale.t.orders.rateYourReview"
        />

        <!-- Provider's review of the client (if any). -->
        <ReviewDisplay
          v-if="order.provider_review"
          :review="order.provider_review"
          :label="locale.t.orders.rateProviderReview"
        />

        <!-- Offers -->
        <div class="space-y-3">
          <div class="flex items-center gap-2 px-1">
            <MessageSquareQuote class="size-4 text-primary" />
            <h3 class="text-base font-semibold text-foreground">
              {{ acceptedOffer ? locale.t.orders.selectedOfferHeading : locale.t.orders.offersHeading }}
              <template v-if="!acceptedOffer">({{ offers.length }})</template>
            </h3>
          </div>

          <GlassCard
            v-if="offers.length === 0"
            padding="none"
            class="overflow-hidden"
          >
            <EmptyState
              :icon="MessageSquareQuote"
              :title="locale.t.orders.noOffersTitle"
              :description="locale.t.orders.noOffersBody"
            />
          </GlassCard>

          <template v-else>
            <OfferCard
              v-for="offer in visibleOffers"
              :key="offer.id"
              :offer="offer"
              :selectable="selectable"
              :accepting="orders.isSubmitting"
              @accept="acceptOffer(offer.id)"
            />
          </template>
        </div>

        <p
          v-if="orders.error"
          class="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {{ orders.error }}
        </p>
      </template>

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

    <Drawer
      v-model:open="cancelDrawerOpen"
      :title="locale.t.orders.cancelConfirmTitle"
    >
      <div class="space-y-4 pb-2">
        <div class="flex flex-col items-center gap-3 px-2 pt-1 text-center">
          <span class="flex size-14 items-center justify-center rounded-full bg-destructive/12 text-destructive dark:bg-destructive/20">
            <XCircle class="size-7" />
          </span>
          <p class="text-sm leading-relaxed text-muted-foreground">
            {{ awaitingPayment ? locale.t.orders.cancelPayConfirmBody : locale.t.orders.cancelConfirmBody }}
          </p>
        </div>

        <div class="flex flex-col gap-2">
          <Button
            variant="destructive"
            class="h-12 w-full rounded-2xl text-base"
            :disabled="orders.isSubmitting"
            @click="cancelOrder"
          >
            <Loader2
              v-if="orders.isSubmitting"
              class="size-4 animate-spin"
            />
            <XCircle
              v-else
              class="size-4"
            />
            {{ locale.t.orders.cancelConfirm }}
          </Button>
          <Button
            variant="outline"
            class="h-12 w-full rounded-2xl"
            :disabled="orders.isSubmitting"
            @click="cancelDrawerOpen = false"
          >
            {{ locale.t.orders.cancelKeep }}
          </Button>
        </div>
      </div>
    </Drawer>
  </div>
</template>
