<script setup lang="ts">
import { Calendar, Eye, Loader2, MessageSquareQuote, Send, User } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import Avatar from '@/core/ui/Avatar.vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import EmptyState from '@/core/ui/EmptyState.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import Badge from '@/core/ui/Badge.vue'
import { Button } from '@/core/ui/button'
import { useToast } from '@/core/composables/useToast'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { categoryName } from '@/core/i18n/category-name'
import { formatDateTime } from '@/core/lib/date'
import { getApiErrorMessage } from '@/core/api/api-error'
import { confirmOtklik } from '@/modules/agent/lib/confirm-otklik'
import { ROUTES } from '@/modules/shell/constants/routes'
import OrderStatusBadge from '@/modules/orders/components/OrderStatusBadge.vue'
import OrderHashtagChips from '@/modules/orders/components/OrderHashtagChips.vue'
import OrderAttachments from '@/modules/orders/components/OrderAttachments.vue'
import { formatPrice, isInterestOffer, offerStatusVariant } from '@/modules/orders/lib/order-status'
import { usePassStore } from '@/modules/agent/stores/pass.store'
import { submitOffer } from '@/modules/orders/services/orders.service'
import { fetchShowcaseOrder, type ShowcaseOrder } from '@/modules/home/services/live-orders.service'
import type { OrderStatus } from '@/modules/orders/types/order'

const props = defineProps<{ id: string }>()

const locale = useLocaleStore()
const router = useRouter()
const toast = useToast()

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

const myOfferIsInterest = computed(() =>
  order.value?.my_offer ? isInterestOffer(order.value.my_offer) : false,
)

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
}

async function sendInterest() {
  if (!order.value || submitting.value) return
  submitting.value = true
  try {
    await submitOffer(order.value.id, {})
    toast.success(locale.t.orders.showcase.interestSent)
    await loadOrder()
  }
  catch (e) {
    if (axios.isAxiosError(e) && e.response?.status === 409) {
      // Another agent claimed this Tezkor request first.
      toast.error(locale.t.route.busyToast)
      await loadOrder()
    }
    else if (!usePassStore().handleClaimError(e, () => sendInterest())) {
      toast.error(getApiErrorMessage(e) || locale.t.orders.showcase.offerError)
    }
  }
  finally {
    submitting.value = false
  }
}

function confirmSendInterest() {
  if (!order.value || submitting.value) return
  void confirmOtklik(() => sendInterest())
}

function openClient(clientId: number) {
  router.push(ROUTES.clientDetail(clientId))
}

onMounted(loadOrder)
</script>

<template>
  <div class="pb-6">
    <AppHeader
      :title="locale.t.orders.showcase.detailTitle"
      :subtitle="locale.t.orders.showcase.detailSubtitle"
      show-back
    />

    <section class="space-y-4 px-5">
      <!-- Loading -->
      <template v-if="loading && !order">
        <Skeleton class="h-40 w-full rounded-3xl" />
        <Skeleton class="h-32 w-full rounded-3xl" />
      </template>

      <template v-else-if="order">
        <!-- Summary card -->
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
                :status="(order.status as OrderStatus)"
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
          </div>

          <p
            v-if="order.description"
            class="text-sm leading-relaxed text-muted-foreground"
          >
            {{ order.description }}
          </p>

          <!-- Deadline -->
          <div
            v-if="order.deadline"
            class="flex items-center gap-2 text-xs text-muted-foreground"
          >
            <Calendar class="size-3.5" />
            <span class="font-medium">{{ locale.t.orders.showcase.deadline }}:</span>
            {{ order.deadline }}
          </div>

          <!-- Stats -->
          <div class="grid grid-cols-2 gap-2">
            <div class="flex items-center gap-2.5 rounded-xl border border-border/60 bg-muted/50 px-3 py-2 dark:border-white/10 dark:bg-white/8">
              <Eye class="size-3.5 shrink-0 text-muted-foreground" />
              <div class="min-w-0 leading-tight">
                <p class="text-[10px] font-semibold capitalize text-muted-foreground">
                  {{ locale.t.orders.showcase.viewsLabel }}
                </p>
                <p class="mt-0.5 text-sm font-bold tabular-nums text-foreground">
                  {{ order.views_count ?? 0 }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2.5 rounded-xl border border-primary/20 bg-primary/8 px-3 py-2 dark:border-primary/25 dark:bg-primary/12">
              <MessageSquareQuote class="size-3.5 shrink-0 text-primary" />
              <div class="min-w-0 leading-tight">
                <p class="text-[10px] font-semibold capitalize text-primary/80">
                  {{ locale.t.orders.showcase.offersLabel }}
                </p>
                <p class="mt-0.5 text-sm font-bold tabular-nums text-primary">
                  {{ order.offers_count ?? 0 }}
                </p>
              </div>
            </div>
          </div>

          <OrderAttachments :files="order.attachment_files" />
        </GlassCard>

        <!-- Owner / client section -->
        <GlassCard
          v-if="order.client"
          class="space-y-2"
        >
          <p class="order-section-title">
            {{ locale.t.orders.showcase.owner }}
          </p>
          <button
            type="button"
            class="flex w-full items-center gap-3 rounded-2xl p-1 text-left transition active:opacity-80"
            @click="openClient(order.client!.id)"
          >
            <Avatar
              :src="order.client.avatar"
              :name="order.client.first_name ?? undefined"
              size="md"
              class="rounded-full"
            />
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm font-semibold text-foreground">
                {{ order.client.first_name }}
              </span>
              <span class="block text-xs text-muted-foreground">
                <User class="mr-0.5 inline size-3" />
                {{ locale.t.orders.showcase.owner }}
              </span>
            </span>
          </button>
        </GlassCard>

        <!-- Existing offer (my_offer) — read-only card -->
        <GlassCard
          v-if="order.my_offer"
          class="space-y-3"
        >
          <div class="flex items-center gap-2">
            <Send class="size-4 text-primary" />
            <h3 class="text-sm font-semibold text-foreground">
              {{ locale.t.orders.showcase.yourOffer }}
            </h3>
            <Badge
              :variant="offerStatusVariant(order.my_offer.status)"
              class="ml-auto"
            >
              {{ locale.t.orders.offerStatus[order.my_offer.status] }}
            </Badge>
          </div>
          <div class="space-y-1.5 rounded-2xl border border-border bg-muted/30 p-3 dark:bg-white/5">
            <Badge
              v-if="myOfferIsInterest"
              variant="primary"
            >
              {{ locale.t.orders.interestBadge }}
            </Badge>
            <p
              v-else
              class="text-sm font-bold text-foreground"
            >
              {{ formatPrice(order.my_offer.price) }}
            </p>
            <p
              v-if="order.my_offer.comment"
              class="text-xs leading-relaxed text-muted-foreground"
            >
              {{ order.my_offer.comment }}
            </p>
          </div>
        </GlassCard>

        <!-- Tezkor: the request is exclusively held by an agent -->
        <p
          v-if="order.route === 'tezkor' && order.claimed_by_me"
          class="claim-note claim-note--mine"
        >
          {{ locale.t.route.yoursBody }}
        </p>
        <template v-else-if="order.route === 'tezkor' && order.claimed">
          <Button
            class="h-12 w-full rounded-2xl text-base"
            disabled
          >
            {{ locale.t.route.busy }}
          </Button>
          <p class="claim-note">
            {{ locale.t.route.busyBody }}
          </p>
        </template>

        <!-- Interest CTA — only if can_offer and no existing offer -->
        <Button
          v-if="order.can_offer && !order.my_offer && !order.claimed"
          class="h-12 w-full rounded-2xl text-base"
          :disabled="submitting"
          @click="confirmSendInterest"
        >
          <Loader2
            v-if="submitting"
            class="size-4 animate-spin"
          />
          <Send
            v-else
            class="size-4"
          />
          {{ locale.t.orders.showcase.sendInterest }}
        </Button>

        <!-- Error -->
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
  </div>
</template>

<style scoped>
.claim-note {
  margin: 0;
  padding: 12px 14px;
  border-radius: var(--rb-r-field);
  background: var(--secondary);
  color: var(--muted-foreground);
  font-size: 13px;
  line-height: 1.45;
}
.claim-note--mine {
  background: color-mix(in srgb, var(--rb-glow) 12%, var(--card));
  color: var(--foreground);
}
</style>
