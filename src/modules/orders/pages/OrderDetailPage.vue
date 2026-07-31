<script setup lang="ts">
import { CheckCircle2, CreditCard, Download, Eye, FileText, Loader2, MessageCircle, MessageSquareQuote, PartyPopper, Star, Store } from '@lucide/vue'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import EmptyState from '@/core/ui/EmptyState.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import { Button } from '@/core/ui/button'
import { useTelegram } from '@/core/composables/useTelegram'
import { useToast } from '@/core/composables/useToast'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { categoryName } from '@/core/i18n/category-name'
import { formatDate } from '@/core/lib/date'
import OrderStatusBadge from '@/modules/orders/components/OrderStatusBadge.vue'
import OfferCard from '@/modules/orders/components/OfferCard.vue'
import { formatPrice } from '@/modules/orders/lib/order-status'
import { useOrdersStore } from '@/modules/orders/stores/orders.store'

const props = defineProps<{ id: string }>()

const orders = useOrdersStore()
const locale = useLocaleStore()
const toast = useToast()
const router = useRouter()
const { haptic } = useTelegram()

const order = computed(() => orders.currentOrder)
const offers = computed(() => order.value?.offers ?? [])
const title = computed(() =>
  order.value?.category ? categoryName(order.value.category, locale.locale) : order.value?.title ?? '',
)
// The client can still pick a winning offer while the order is open.
const selectable = computed(() =>
  order.value ? ['new', 'offers_sent'].includes(order.value.status) : false,
)
// Client picked an offer but hasn't paid yet — show the checkout prompt.
const awaitingPayment = computed(() => order.value?.status === 'awaiting_payment')
// The agent delivered — the client decides: accept or report a problem.
const awaitingConfirmation = computed(() => order.value?.status === 'work_submitted')

// A deal exists (and so does its chat) from activation onwards.
const hasChat = computed(() =>
  order.value ? ['in_progress', 'work_submitted', 'completed'].includes(order.value.status) : false,
)

// Rating: offered once the order completes, until a review is stored.
const hasReview = computed(() => Boolean(order.value?.review?.rating))
const canRate = computed(() => order.value?.status === 'completed' && !hasReview.value)
const attachmentFiles = computed(() => order.value?.attachment_files ?? [])
const ratingDraft = ref(0)
const ratingComment = ref('')

// Attachments carry storage-hashed names (unreadable), so we represent each
// file by its type + size and a download affordance instead of the raw name.
function isImageAttachment(file: { mime_type: string | null }): boolean {
  return (file.mime_type ?? '').startsWith('image/')
}

/** Short, human file-type label (PDF, PNG, DOC…) — empty when undeterminable. */
function attachmentType(file: { original_name: string, mime_type: string | null }): string {
  const ext = /\.([a-z0-9]{1,6})$/i.exec(file.original_name ?? '')?.[1]
  if (ext) return ext.toUpperCase()

  const sub = (file.mime_type ?? '').split('/')[1] ?? ''
  if (sub.includes('pdf')) return 'PDF'
  if (sub.includes('word')) return 'DOC'
  if (sub.includes('sheet') || sub.includes('excel')) return 'XLS'
  if (sub.includes('presentation')) return 'PPT'
  if (sub.includes('zip') || sub.includes('rar') || sub.includes('compressed')) return 'ZIP'
  return sub && sub.length <= 4 ? sub.toUpperCase() : ''
}

function formatFileSize(bytes: number): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

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

async function sendReview() {
  if (!order.value || ratingDraft.value < 1) return
  haptic('light')
  const ok = await orders.submitReview(
    order.value.id,
    ratingDraft.value,
    ratingComment.value.trim() || null,
  )
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
          <div class="min-w-0">
            <OrderStatusBadge
              :status="order.status"
              class="mb-2"
            />
            <h2 class="text-lg font-semibold leading-tight text-foreground">
              {{ title }}
            </h2>
            <p class="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span class="rounded-md bg-muted px-1.5 py-0.5 font-semibold tabular-nums text-foreground/70 dark:bg-white/10">
                #{{ order.id }}
              </span>
              <span aria-hidden="true">·</span>
              {{ formatDate(order.created_at, locale.locale) }}
            </p>
            <p
              v-if="order.target_agent"
              class="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
            >
              <Store class="size-3.5" />
              {{ order.target_agent.company_name }}
            </p>
          </div>

          <p class="text-sm leading-relaxed text-muted-foreground">
            {{ order.description }}
          </p>

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

          <div
            v-if="attachmentFiles.length > 0"
            class="space-y-2"
          >
            <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {{ locale.t.orders.attachedFiles }}
            </p>
            <div class="flex flex-wrap gap-2">
              <a
                v-for="file in attachmentFiles"
                :key="file.id"
                :href="file.url"
                target="_blank"
                rel="noopener"
                :download="file.original_name"
                class="group flex items-center gap-2.5 rounded-2xl border border-dashed border-border bg-card/40 px-3 py-2.5 transition active:scale-[0.98] dark:bg-white/5"
              >
                <!-- Image → thumbnail; any other file → a document icon. Never
                     the raw (storage-hashed) name. -->
                <span class="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/10 text-primary">
                  <img
                    v-if="isImageAttachment(file)"
                    :src="file.url"
                    alt=""
                    class="size-full object-cover"
                    loading="lazy"
                  >
                  <FileText v-else class="size-5" />
                </span>
                <span class="flex min-w-0 flex-col leading-tight">
                  <span v-if="attachmentType(file)" class="text-xs font-bold text-foreground">
                    {{ attachmentType(file) }}
                  </span>
                  <span v-if="formatFileSize(file.size)" class="text-[11px] text-muted-foreground">
                    {{ formatFileSize(file.size) }}
                  </span>
                </span>
                <Download class="size-4 shrink-0 text-muted-foreground transition group-active:text-primary" />
              </a>
            </div>
          </div>

          <Button
            v-if="hasChat"
            variant="outline"
            class="h-11 w-full rounded-2xl"
            @click="openChat"
          >
            <MessageCircle class="size-4" />
            {{ locale.t.chat.openChat }}
          </Button>
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

        <!-- Rating: once completed, ask the client to rate the agency. -->
        <GlassCard
          v-if="canRate"
          class="space-y-3"
        >
          <h3 class="text-base font-semibold">
            {{ locale.t.orders.rateTitle }}
          </h3>
          <p class="text-sm text-muted-foreground">
            {{ locale.t.orders.rateBody }}
          </p>

          <div class="flex justify-center gap-2 py-1">
            <button
              v-for="star in 5"
              :key="star"
              type="button"
              class="p-1"
              @click="ratingDraft = star"
            >
              <Star
                class="size-8 transition-colors"
                :class="star <= ratingDraft ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40'"
              />
            </button>
          </div>

          <textarea
            v-model="ratingComment"
            rows="2"
            :placeholder="locale.t.orders.rateCommentPlaceholder"
            class="glass-input resize-none"
          />

          <Button
            class="h-11 w-full rounded-2xl"
            :disabled="ratingDraft < 1 || orders.isSubmitting"
            @click="sendReview"
          >
            <Loader2
              v-if="orders.isSubmitting"
              class="size-4 animate-spin"
            />
            {{ locale.t.orders.rateSubmit }}
          </Button>
        </GlassCard>

        <!-- Already rated -->
        <GlassCard
          v-else-if="hasReview"
          class="space-y-2"
        >
          <p class="text-sm font-medium">
            {{ locale.t.orders.yourRating }}
          </p>
          <div class="flex gap-1">
            <Star
              v-for="star in 5"
              :key="star"
              class="size-5"
              :class="star <= (order.review?.rating ?? 0) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40'"
            />
          </div>
          <p
            v-if="order.review?.comment"
            class="text-sm text-muted-foreground"
          >
            {{ order.review.comment }}
          </p>
        </GlassCard>

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

          <OfferCard
            v-for="offer in offers"
            v-else
            :key="offer.id"
            :offer="offer"
            :selectable="selectable"
            :accepting="orders.isSubmitting"
            @accept="acceptOffer(offer.id)"
          />
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
  </div>
</template>
