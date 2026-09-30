<script setup lang="ts">
import {
  Calendar,
  Wallet,
  Eye,
  FileText,
  Loader2,
  MapPinned,
  MessageSquareQuote,
  Send,
  User,
} from '@lucide/vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import Avatar from '@/core/ui/Avatar.vue'
import Badge from '@/core/ui/Badge.vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import LocationMap from '@/core/ui/LocationMap.vue'
import EmptyState from '@/core/ui/EmptyState.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import { Button } from '@/core/ui/button'
import { useTelegram } from '@/core/composables/useTelegram'
import { useToast } from '@/core/composables/useToast'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { categoryName } from '@/core/i18n/category-name'
import { formatDateTime } from '@/core/lib/date'
import { formatDeadlineRange } from '@/modules/orders/lib/order-terms'
import { getApiErrorMessage } from '@/core/api/api-error'
import { confirmOtklik } from '@/modules/agent/lib/confirm-otklik'
import { ROUTES } from '@/modules/shell/constants/routes'
import { formatPrice, isInterestOffer, offerStatusVariant } from '@/modules/orders/lib/order-status'
import { formatOrderRegion } from '@/modules/orders/lib/region-label'
import OrderAttachments from '@/modules/orders/components/OrderAttachments.vue'
import { fetchAgentOrder, openOfferChat } from '@/modules/orders/services/orders.service'
import { useOrdersStore } from '@/modules/orders/stores/orders.store'
import type { AgentOrder } from '@/modules/orders/types/order'

const props = defineProps<{ id: string }>()

const locale = useLocaleStore()
const router = useRouter()
const toast = useToast()
const { haptic } = useTelegram()
const orders = useOrdersStore()

const order = ref<AgentOrder | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const title = computed(() => {
  if (!order.value) return ''
  return order.value.title
    || (order.value.category ? categoryName(order.value.category, locale.locale) : '')
})

const categoryLabel = computed(() =>
  order.value?.category ? categoryName(order.value.category, locale.locale) : null,
)

const budgetLabel = computed(() => {
  const value = order.value?.budget_max
  return value != null && Number(value) > 0 ? formatPrice(value) : null
})

const deadlineLabel = computed(() => {
  const range = order.value ? formatDeadlineRange(order.value.deadline_from, order.value.deadline_to, locale.locale) : ''
  if (range) return range
  if (order.value?.deadline === 'this_week') return locale.t.orders.deadlineThisWeek
  if (order.value?.deadline === 'today_tomorrow') return locale.t.orders.deadlineTodayTomorrow
  return null
})

const regionLabel = computed(() =>
  order.value ? formatOrderRegion(order.value, locale.locale) : null,
)

const myOfferIsInterest = computed(() =>
  order.value?.my_offer ? isInterestOffer(order.value.my_offer) : false,
)

async function loadOrder() {
  loading.value = true
  error.value = null
  try {
    const data = await fetchAgentOrder(Number(props.id))
    // Already responded — land on the offer detail instead. A Tezkor request
    // the client picked me for stays here: this page shows their contact.
    if (data.my_offer && !(data.route === 'tezkor' && data.claimed_by_me)) {
      await orders.loadAgentWorkspace(true)
      const mine = orders.myOffers.find(o => o.order.id === data.id)
      if (mine) {
        await router.replace(ROUTES.offerDetail(mine.id))
        return
      }
    }
    order.value = data
  }
  catch (e) {
    order.value = null
    error.value = getApiErrorMessage(e)
  }
  finally {
    loading.value = false
  }
}

async function sendInterest() {
  if (!order.value || orders.isSubmitting) return
  haptic('light')
  const ok = await orders.sendOffer(order.value.id, {}, () => sendInterest())
  if (ok) {
    haptic('medium')
    toast.success(locale.t.orders.showcase.interestSent)
    const created = orders.myOffers.find(o => o.order.id === order.value!.id)
    if (created) {
      await router.replace(ROUTES.offerDetail(created.id))
      return
    }
    await loadOrder()
  }
  else if (orders.error) {
    toast.error(orders.error)
  }
}

const isTezkor = computed(() => order.value?.route === 'tezkor')
const pickedMe = computed(() => isTezkor.value && order.value?.claimed_by_me === true)

async function openClientChat() {
  const offerId = order.value?.my_offer?.id
  if (!offerId) return
  haptic('light')
  try {
    const chat = await openOfferChat(offerId)
    router.push(ROUTES.chatDirect(chat.id))
  }
  catch (e) {
    toast.error(getApiErrorMessage(e))
  }
}

function confirmSendInterest() {
  if (!order.value || orders.isSubmitting) return
  void confirmOtklik(() => sendInterest())
}

function openClient(clientId: number) {
  router.push(ROUTES.clientDetail(clientId))
}

function openMyOffer() {
  if (!order.value?.my_offer) return
  const mine = orders.myOffers.find(o => o.order.id === order.value!.id)
  if (mine) router.push(ROUTES.offerDetail(mine.id))
}

onMounted(loadOrder)
watch(() => props.id, loadOrder)
</script>

<template>
  <div class="pb-6">
    <AppHeader
      :title="locale.t.agent.opportunityDetailTitle"
      :subtitle="locale.t.agent.opportunityDetailSubtitle"
      show-back
    />

    <section class="space-y-4 px-5">
      <template v-if="loading && !order">
        <Skeleton class="h-40 w-full rounded-3xl" />
        <Skeleton class="h-32 w-full rounded-3xl" />
      </template>

      <template v-else-if="order">
        <GlassCard class="space-y-4">
          <div class="min-w-0">
            <div class="mb-2 flex flex-wrap items-center gap-2">
              <Badge
                v-if="order.my_offer"
                :variant="offerStatusVariant(order.my_offer.status)"
              >
                {{ locale.t.orders.offerStatus[order.my_offer.status] }}
              </Badge>
            </div>
            <p
              v-if="categoryLabel"
              class="mb-1 text-xs font-bold text-primary"
            >
              {{ categoryLabel }}
            </p>
            <h2 class="rb-font-display text-lg font-extrabold leading-tight tracking-[-0.015em] text-foreground">
              {{ title }}
            </h2>
            <p class="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <span class="rounded-md bg-muted px-1.5 py-0.5 font-semibold tabular-nums text-foreground/70 dark:bg-white/10">
                #{{ order.id }}
              </span>
              <span aria-hidden="true">·</span>
              {{ formatDateTime(order.created_at) }}
            </p>
          </div>

          <p
            v-if="order.description"
            class="whitespace-pre-line text-sm leading-relaxed text-muted-foreground"
          >
            {{ order.description }}
          </p>

          <div
            v-if="budgetLabel"
            class="flex items-center gap-2 text-sm text-foreground"
          >
            <Wallet class="size-4 shrink-0 text-primary" />
            <span class="text-xs font-medium text-muted-foreground">{{ locale.t.orders.factBudget }}:</span>
            <span class="font-bold tabular-nums">{{ budgetLabel }}</span>
          </div>

          <div
            v-if="deadlineLabel"
            class="flex items-center gap-2 text-xs text-muted-foreground"
          >
            <Calendar class="size-3.5 shrink-0" />
            <span class="font-medium">{{ deadlineLabel }}</span>
          </div>

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

          <div class="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span class="inline-flex items-center gap-1.5">
              <Eye class="size-3.5" />
              {{ order.views_count ?? 0 }} {{ locale.t.orders.viewsSuffix }}
            </span>
            <span class="inline-flex items-center gap-1.5">
              <MessageSquareQuote class="size-3.5" />
              {{ order.offers_count ?? 0 }} {{ locale.t.orders.offersSuffix }}
            </span>
          </div>

          <OrderAttachments :files="order.attachment_files ?? []" />
        </GlassCard>

        <GlassCard
          v-if="order.client?.id || order.client?.first_name"
          class="space-y-2"
        >
          <p class="order-section-title">
            {{ locale.t.agent.fromLabel }}
          </p>
          <button
            v-if="order.client.id"
            type="button"
            class="flex w-full items-center gap-3 rounded-2xl p-1 text-left transition active:opacity-80"
            @click="openClient(order.client.id!)"
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
                {{ locale.t.agent.fromLabel }}
              </span>
            </span>
          </button>
          <p
            v-else
            class="text-sm font-medium text-foreground"
          >
            {{ order.client.first_name }}
          </p>
        </GlassCard>

        <!-- Tezkor: the client picked me — their contact -->
        <GlassCard
          v-if="pickedMe"
          class="space-y-3"
        >
          <div class="flex items-center justify-between gap-2">
            <h3 class="text-sm font-semibold text-foreground">
              {{ locale.t.route.clientContact }}
            </h3>
            <Badge variant="primary">
              {{ locale.t.route.mine }}
            </Badge>
          </div>
          <p class="text-[13px] leading-relaxed text-muted-foreground">
            {{ locale.t.route.yoursBody }}
          </p>
          <div class="flex flex-wrap gap-2">
            <a
              v-if="order.client.phone"
              :href="`tel:${order.client.phone}`"
              class="tez-action"
            >{{ order.client.phone }}</a>
            <a
              v-if="order.client.username"
              :href="`https://t.me/${order.client.username}`"
              target="_blank"
              rel="noopener"
              class="tez-action"
            >@{{ order.client.username }}</a>
            <button
              v-if="order.my_offer"
              type="button"
              class="tez-action"
              @click="openClientChat"
            >
              {{ locale.t.route.chat }}
            </button>
          </div>
        </GlassCard>

        <!-- Already responded -->
        <GlassCard
          v-else-if="order.my_offer"
          class="space-y-3"
        >
          <div class="flex items-center justify-between gap-2">
            <h3 class="text-sm font-semibold text-foreground">
              {{ locale.t.agent.yourOffer }}
            </h3>
            <Badge
              v-if="myOfferIsInterest"
              variant="primary"
            >
              {{ locale.t.orders.interestBadge }}
            </Badge>
            <p
              v-else
              class="text-sm font-bold tabular-nums text-primary"
            >
              {{ formatPrice(order.my_offer.price) }}
            </p>
          </div>
          <Button
            variant="outline"
            class="h-11 w-full rounded-2xl"
            @click="openMyOffer"
          >
            {{ locale.t.agent.viewOfferDetail }}
          </Button>
        </GlassCard>

        <!-- One-tap interest CTA -->
        <Button
          v-else
          class="h-12 w-full rounded-2xl text-base"
          :disabled="orders.isSubmitting"
          @click="confirmSendInterest"
        >
          <Loader2
            v-if="orders.isSubmitting"
            class="size-4 animate-spin"
          />
          <Send
            v-else
            class="size-4"
          />
          {{ locale.t.orders.showcase.sendInterest }}
        </Button>

        <p
          v-if="error"
          class="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {{ error }}
        </p>
      </template>

      <GlassCard
        v-else
        padding="none"
        class="overflow-hidden"
      >
        <EmptyState
          :icon="FileText"
          :title="locale.t.agent.opportunityDetailNotFound"
          :description="error || locale.t.agent.opportunityDetailNotFoundBody"
        />
      </GlassCard>
    </section>
  </div>
</template>

<style scoped>
.tez-action {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  padding: 0 14px;
  border: 1px solid var(--border);
  border-radius: var(--rb-r-field);
  background: var(--secondary);
  color: var(--foreground);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  text-decoration: none;
  -webkit-tap-highlight-color: transparent;
}
.tez-action:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; }
</style>
