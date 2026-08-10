<script setup lang="ts">
import { CheckCircle2, CreditCard, Eye, Loader2, MapPinned, MessageCircle, MessageSquareQuote, PartyPopper, Store, XCircle } from '@lucide/vue'
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
        <GlassCard class="space-y-4">
          <div class="min-w-0 space-y-1.5">
            <div class="flex items-start justify-between gap-2">
              <p
                v-if="categoryLabel"
                class="min-w-0 truncate text-xs font-bold text-primary"
              >
                {{ categoryLabel }}
              </p>
              <span
                v-else
                class="min-w-0 flex-1"
              />
              <OrderStatusBadge
                :status="order.status"
                class="shrink-0"
              />
            </div>

            <h2 class="flex min-w-0 items-baseline gap-2 text-lg font-semibold leading-tight text-foreground">
              <span class="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-xs font-semibold tabular-nums text-foreground/70 dark:bg-white/10">
                #{{ order.id }}
              </span>
              <span class="min-w-0 truncate">{{ title }}</span>
            </h2>

            <p class="text-xs font-medium tabular-nums text-muted-foreground">
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

          <p class="text-sm leading-relaxed text-muted-foreground">
            {{ order.description }}
          </p>

          <div
            v-if="regionLabel"
            class="flex items-center gap-2 text-xs text-muted-foreground"
          >
            <MapPinned class="size-3.5 shrink-0" />
            <span class="font-medium">{{ regionLabel }}</span>
          </div>

          <LocationMap
            v-if="order.lat != null && order.lng != null"
            :lat="order.lat"
            :lng="order.lng"
            :label="order.location_label"
          />

          <div class="flex items-center gap-4 text-xs text-muted-foreground">
            <span class="inline-flex items-center gap-1.5">
              <Eye class="size-3.5" />
              {{ order.views_count ?? 0 }} {{ locale.t.orders.viewsSuffix }}
            </span>
            <span class="inline-flex items-center gap-1.5">
              <MessageSquareQuote class="size-3.5" />
              {{ offers.length }} {{ locale.t.orders.offersSuffix }}
            </span>
          </div>

          <OrderAttachments :files="attachmentFiles" />

          <Button
            v-if="hasChat"
            variant="outline"
            class="h-11 w-full rounded-2xl"
            @click="openChat"
          >
            <MessageCircle class="size-4" />
            {{ locale.t.chat.openChat }}
          </Button>

          <!-- Compact red button — visible, but not a hero block. -->
          <button
            v-if="canCancel"
            type="button"
            class="pressable inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-destructive px-3 text-xs font-semibold text-white transition active:scale-[0.98] active:brightness-95"
            @click="openCancelDrawer"
          >
            <XCircle class="size-3.5" />
            {{ locale.t.orders.cancelOrder }}
          </button>
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
              {{ locale.t.orders.offersHeading }} ({{ offers.length }})
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
              v-for="offer in offers"
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
