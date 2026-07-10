<script setup lang="ts">
import { CheckCircle2, Eye, FileText, Loader2, MessageCircle, MessageSquareQuote, PartyPopper, Star, Store } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
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
import { categoryIcon } from '@/modules/orders/lib/category-icon'
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
// The agent delivered — the client decides: accept or report a problem.
const awaitingConfirmation = computed(() => order.value?.status === 'work_submitted')

// A deal exists (and so does its chat) from activation onwards.
const hasChat = computed(() =>
  order.value ? ['in_progress', 'work_submitted', 'completed'].includes(order.value.status) : false,
)

// Rating: offered once the order completes, until a review is stored.
const hasReview = computed(() => Boolean(order.value?.review?.rating))
const canRate = computed(() => order.value?.status === 'completed' && !hasReview.value)
const ratingDraft = ref(0)
const ratingComment = ref('')

onMounted(() => orders.loadOrder(Number(props.id)))

async function acceptOffer(offerId: number) {
  haptic('light')
  const ok = await orders.accept(offerId)
  if (ok) haptic('medium')
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
          <div class="flex items-start gap-3">
            <span class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <component
                :is="categoryIcon(order.category)"
                class="size-5"
              />
            </span>
            <div class="min-w-0 flex-1">
              <div class="flex items-start justify-between gap-2">
                <h2 class="text-lg font-semibold leading-tight text-foreground">
                  {{ title }}
                </h2>
                <OrderStatusBadge
                  :status="order.status"
                  class="shrink-0"
                />
              </div>
              <p class="mt-1 text-xs text-muted-foreground">
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

          <a
            v-if="order.tz_file"
            :href="order.tz_file"
            target="_blank"
            rel="noopener"
            class="glass-field flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-primary"
          >
            <FileText class="size-4" />
            {{ locale.t.orders.viewBrief }}
          </a>

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
