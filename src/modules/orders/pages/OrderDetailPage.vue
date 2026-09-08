<script setup lang="ts">
import { CheckCircle2, CreditCard, Loader2, MessageCircle, MessageSquareQuote, XCircle } from '@lucide/vue'
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
import OrderHashtagChips from '@/modules/orders/components/OrderHashtagChips.vue'
import OrderAttachments from '@/modules/orders/components/OrderAttachments.vue'
import OfferCard from '@/modules/orders/components/OfferCard.vue'
import OrderStateCard from '@/modules/orders/components/OrderStateCard.vue'
import ContractDownloadCard from '@/modules/orders/components/ContractDownloadCard.vue'
import ContractAgreementDrawer from '@/modules/orders/components/ContractAgreementDrawer.vue'
import PaymentMethodsDrawer from '@/modules/orders/components/PaymentMethodsDrawer.vue'
import AmendmentsSection from '@/modules/orders/components/AmendmentsSection.vue'
import CriteriaReviewForm from '@/modules/orders/components/CriteriaReviewForm.vue'
import ReviewDisplay from '@/modules/orders/components/ReviewDisplay.vue'
import { formatOrderRegion } from '@/modules/orders/lib/region-label'
import { getApiErrorMessage } from '@/core/api/api-error'
import { fetchOfferContract } from '@/modules/orders/services/orders.service'
import { useOrdersStore } from '@/modules/orders/stores/orders.store'
import type { ContractDocument, Offer, ReviewCriterionScore } from '@/modules/orders/types/order'

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
// (Legacy flow: orders parked in awaiting_payment before deals activated on
// contract acceptance.)
const awaitingPayment = computed(() => order.value?.status === 'awaiting_payment')
// The backend decides: open orders and unpaid active deals any time, a paid
// deal only inside the cooling-off window (cancel_deadline_at).
const canCancel = computed(() =>
  order.value?.can_cancel ?? (selectable.value || awaitingPayment.value),
)
const cancelRefunds = computed(() => order.value?.payment_state === 'paid')
// The window is short (an hour by default), so a countdown reads better than a
// timestamp: "42 daqiqa qoldi".
const cancelMinutesLeft = computed(() => {
  const deadline = order.value?.cancel_deadline_at
  if (!deadline) return null
  return Math.max(0, Math.ceil((new Date(deadline).getTime() - Date.now()) / 60000))
})
const cancelDeadlineLabel = computed(() =>
  cancelMinutesLeft.value === null
    ? null
    : locale.t.orders.cancelWindowLeft.replace('{minutes}', String(cancelMinutesLeft.value)),
)

// The deal is running and the money is still owed — the client picks how to pay.
const needsPayment = computed(() =>
  order.value?.payment_state === 'unpaid' || awaitingPayment.value,
)
const paymentOverdue = computed(() => {
  const due = order.value?.payment_due_at
  return Boolean(needsPayment.value && due && new Date(due).getTime() < Date.now())
})
const amountDue = computed(() =>
  acceptedOffer.value?.price ?? order.value?.payment?.amount_som ?? null,
)
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

// Payment method picker for an active, unpaid deal.
const paymentDrawerOpen = ref(false)

// Contract confirmation before accepting an offer.
const contractDrawerOpen = ref(false)
const contractOffer = ref<Offer | null>(null)
const contractDoc = ref<ContractDocument | null>(null)
const contractLoading = ref(false)
const contractError = ref<string | null>(null)

// When the client returns from the checkout page (tab becomes visible again),
// re-check the payment so the order flips to in_progress without a manual reload.
async function recheckPayment() {
  if (document.visibilityState !== 'visible' || !needsPayment.value || !order.value) return
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

/**
 * Picking an agency is signing the three-party contract, so the accept button
 * opens the contract first — the deal only starts once the client confirms it.
 */
async function reviewOfferContract(offer: Offer) {
  contractOffer.value = offer
  contractDoc.value = null
  contractError.value = null
  contractLoading.value = true
  contractDrawerOpen.value = true
  haptic('light')

  try {
    contractDoc.value = await fetchOfferContract(offer.id)
  }
  catch (e) {
    contractError.value = getApiErrorMessage(e)
  }
  finally {
    contractLoading.value = false
  }
}

async function acceptContract() {
  const offer = contractOffer.value
  if (!offer || orders.isSubmitting) return

  haptic('light')
  const ok = await orders.accept(offer.id, contractDoc.value?.hash ?? null)
  if (ok) {
    haptic('medium')
    contractDrawerOpen.value = false
    contractOffer.value = null
  }
  else if (orders.error) {
    contractError.value = orders.error
  }
}

function openPaymentOptions() {
  haptic('light')
  paymentDrawerOpen.value = true
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
      :title="order ? (title || locale.t.orders.detailTitle) : locale.t.orders.detailTitle"
      :subtitle="order ? `${locale.t.orders.detailTitle} #${order.id}` : locale.t.orders.detailSubtitle"
      show-back
    />

    <section class="space-y-4 px-5">
      <template v-if="orders.isLoading && !order">
        <Skeleton class="h-40 w-full rounded-3xl" />
        <Skeleton class="h-32 w-full rounded-3xl" />
      </template>

      <template v-else-if="order">
        <!-- Where the work is, and — kept apart — where the money is. -->
        <OrderStateCard :order="order">
          <template #action>
            <!-- Each state shows exactly one primary action. -->
            <div
              v-if="needsPayment"
              class="space-y-2"
            >
              <Button
                class="h-12 w-full rounded-2xl text-[15px]"
                :disabled="orders.isSubmitting"
                @click="openPaymentOptions"
              >
                <Loader2
                  v-if="orders.isSubmitting"
                  class="size-4 animate-spin"
                />
                <CreditCard
                  v-else
                  class="size-4"
                />
                {{ locale.t.orders.pay.payButton }}
              </Button>
              <!-- The due date itself lives in the state card; only the
                   overdue warning needs the extra emphasis here. -->
              <p
                v-if="paymentOverdue"
                class="text-center text-[11.5px] font-semibold text-destructive"
              >
                {{ locale.t.orders.pay.overdue }}
              </p>
            </div>

            <div
              v-else-if="awaitingConfirmation"
              class="space-y-2"
            >
              <div class="flex gap-2">
                <Button
                  class="h-12 flex-1 rounded-2xl"
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
                  class="h-12 rounded-2xl text-destructive"
                  :disabled="orders.isSubmitting"
                  @click="disputeWork"
                >
                  {{ locale.t.orders.disputeWork }}
                </Button>
              </div>
              <p class="text-[11.5px] leading-snug text-muted-foreground">
                {{ locale.t.orders.workReadyAutoNote }}
              </p>
            </div>

            <Button
              v-else-if="hasChat"
              class="h-12 w-full rounded-2xl text-[15px]"
              @click="openChat"
            >
              <MessageCircle class="size-4" />
              {{ locale.t.chat.openChat }}
            </Button>
          </template>
        </OrderStateCard>

        <!-- Facts: label/value rows, scannable at a glance -->
        <GlassCard class="space-y-3">
          <p class="section-label">
            {{ locale.t.orders.factsTitle }}
          </p>

          <dl class="facts">
            <div class="fact">
              <dt>{{ locale.t.orders.factCategory }}</dt>
              <dd :class="categoryLabel ? '' : 'fact__empty'">
                {{ categoryLabel ?? locale.t.orders.factNotSet }}
              </dd>
            </div>
            <div class="fact">
              <dt>{{ locale.t.orders.factRegion }}</dt>
              <dd :class="regionLabel ? '' : 'fact__empty'">
                {{ regionLabel ?? locale.t.orders.factNotSet }}
              </dd>
            </div>
            <div
              v-if="order.target_agent"
              class="fact"
            >
              <dt>{{ locale.t.orders.wizard.directedTo }}</dt>
              <dd>{{ order.target_agent.company_name }}</dd>
            </div>
            <div class="fact">
              <dt>{{ locale.t.orders.factCreated }}</dt>
              <dd class="tabular-nums">
                {{ formatDateTime(order.created_at) }}
              </dd>
            </div>
            <div class="fact">
              <dt>{{ locale.t.orders.factActivity }}</dt>
              <dd class="tabular-nums">
                {{ order.views_count ?? 0 }} · <span class="text-primary">{{ offers.length }}</span>
              </dd>
            </div>
          </dl>
        </GlassCard>

        <!-- The request itself -->
        <GlassCard
          v-if="order.description || order.hashtags?.length || attachmentFiles.length"
          class="space-y-3"
        >
          <p class="section-label">
            {{ locale.t.orders.commentTitle }}
          </p>

          <p
            v-if="order.description"
            class="whitespace-pre-line text-sm leading-relaxed text-foreground"
          >
            {{ order.description }}
          </p>

          <OrderHashtagChips
            v-if="order.hashtags?.length"
            :hashtags="order.hashtags"
          />

          <OrderAttachments
            v-if="attachmentFiles.length"
            :files="attachmentFiles"
            hide-title
          />
        </GlassCard>

        <!-- Location -->
        <GlassCard
          v-if="regionLabel || (order.lat != null && order.lng != null)"
          padding="none"
          class="overflow-hidden"
        >
          <div class="flex items-center justify-between gap-3 p-4 pb-3">
            <p class="section-label">
              {{ locale.t.orders.locationTitle }}
            </p>
            <span
              v-if="regionLabel"
              class="truncate text-[12.5px] font-semibold text-foreground"
            >{{ regionLabel }}</span>
          </div>
          <LocationMap
            v-if="order.lat != null && order.lng != null"
            :lat="order.lat"
            :lng="order.lng"
            :label="order.location_label"
          />
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
          :window="order.amendment_window ?? null"
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
              <template v-if="!acceptedOffer">
                ({{ offers.length }})
              </template>
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
              @accept="reviewOfferContract(offer)"
            />
          </template>
        </div>

        <p
          v-if="orders.error"
          class="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {{ orders.error }}
        </p>

        <!-- Quiet danger zone, always last -->
        <div
          v-if="canCancel"
          class="flex justify-center pb-2 pt-1"
        >
          <button
            type="button"
            class="pressable inline-flex h-9 items-center justify-center gap-1.5 rounded-full px-5 text-[13px] font-semibold text-destructive transition active:scale-95 active:bg-destructive/10"
            @click="openCancelDrawer"
          >
            <XCircle class="size-4" />
            {{ locale.t.orders.cancelShort }}
          </button>
        </div>
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
            {{ cancelRefunds
              ? locale.t.orders.cancelPaidConfirmBody
              : awaitingPayment
                ? locale.t.orders.cancelPayConfirmBody
                : locale.t.orders.cancelConfirmBody }}
          </p>
          <p
            v-if="cancelRefunds && cancelDeadlineLabel"
            class="text-[12px] font-medium text-muted-foreground"
          >
            {{ cancelDeadlineLabel }}
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

    <PaymentMethodsDrawer
      v-if="order"
      v-model:open="paymentDrawerOpen"
      :order-id="order.id"
      :amount="amountDue"
      :payment="order.payment ?? null"
    />

    <ContractAgreementDrawer
      v-model:open="contractDrawerOpen"
      party="client"
      :document="contractDoc"
      :loading="contractLoading"
      :submitting="orders.isSubmitting"
      :acceptances="contractOffer?.contract ?? null"
      :error="contractError"
      @accept="acceptContract"
    />
  </div>
</template>
<style scoped>
.section-label {
  margin: 0;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted-foreground);
}

.facts { margin: 0; display: flex; flex-direction: column; }

.fact {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 9px 0;
  border-bottom: 1px solid color-mix(in srgb, var(--border) 65%, transparent);
}
.fact:last-child { border-bottom: 0; padding-bottom: 0; }
.fact:first-child { padding-top: 0; }

.fact dt {
  flex-shrink: 0;
  font-size: 13px;
  color: var(--muted-foreground);
}
.fact dd {
  margin: 0;
  min-width: 0;
  font-size: 13.5px;
  font-weight: 600;
  text-align: right;
  color: var(--foreground);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.fact__empty { font-weight: 500; color: var(--muted-foreground); }
</style>
