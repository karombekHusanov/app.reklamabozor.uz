<script setup lang="ts">
import { CheckCircle2, Inbox, Loader2, MessageCircle } from '@lucide/vue'
import { computed, nextTick, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import GlassCard from '@/core/ui/GlassCard.vue'
import Badge from '@/core/ui/Badge.vue'
import EmptyState from '@/core/ui/EmptyState.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import { Button } from '@/core/ui/button'
import { useTelegram } from '@/core/composables/useTelegram'
import { useToast } from '@/core/composables/useToast'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { categoryName } from '@/core/i18n/category-name'
import AgentOrderItem from '@/modules/agent/components/AgentOrderItem.vue'
import { formatPrice, orderStatusVariant } from '@/modules/orders/lib/order-status'
import { useOrdersStore } from '@/modules/orders/stores/orders.store'
import type { CreateOfferPayload } from '@/modules/orders/types/order'

const locale = useLocaleStore()

const props = defineProps<{
  /** Deep-link target — scroll to and highlight this order once loaded. */
  focusOrderId?: number | null
  /** Hide the opportunities sub-header (page supplies its own hero). */
  hideOpportunitiesHeader?: boolean
}>()

const orders = useOrdersStore()
const toast = useToast()
const router = useRouter()
const { haptic } = useTelegram()

// Won deals the agent is currently working on (or waiting for the client to
// confirm). Open orders live in `availableOrders`; these come from the
// agent's accepted offers.
const activeDeals = computed(() =>
  orders.myOffers.filter(offer =>
    offer.status === 'accepted'
    && (offer.order.status === 'in_progress' || offer.order.status === 'work_submitted'),
  ),
)

onMounted(() => orders.loadAgentWorkspace())

// Scroll the deep-linked order into view once the lists have loaded.
watch(
  [() => orders.availableOrders, () => orders.myOffers, () => props.focusOrderId],
  async () => {
    if (!props.focusOrderId) return
    await nextTick()
    document
      .getElementById(`agent-order-${props.focusOrderId}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  },
  { immediate: true },
)

async function handleSubmit(orderId: number, payload: CreateOfferPayload) {
  haptic('light')
  const ok = await orders.sendOffer(orderId, payload)
  if (ok) haptic('medium')
}

async function handleSubmitWork(orderId: number) {
  haptic('light')
  const ok = await orders.submitWork(orderId)
  if (ok) {
    haptic('medium')
    toast.success(locale.t.agent.submitWorkToast)
  }
}
</script>

<template>
  <div class="space-y-3">
    <!-- Active deals: accepted offers with work in progress / awaiting confirmation. -->
    <template v-if="activeDeals.length > 0">
      <h3 class="px-1 text-base font-semibold text-foreground">
        {{ locale.t.agent.activeDeals }}
      </h3>

      <GlassCard
        v-for="deal in activeDeals"
        :id="`agent-order-${deal.order.id}`"
        :key="deal.id"
        class="scroll-mt-20 space-y-3"
        :class="deal.order.id === focusOrderId && 'ring-2 ring-primary/50'"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="truncate font-semibold leading-tight">
              {{ deal.order.category ? categoryName(deal.order.category, locale.locale) : deal.order.title }}
            </p>
            <p class="text-xs text-muted-foreground">
              #{{ deal.order.id }} · {{ locale.t.agent.yourOffer }} {{ formatPrice(deal.price) }}
            </p>
          </div>
          <Badge
            v-if="deal.order.status"
            :variant="orderStatusVariant(deal.order.status)"
            class="shrink-0"
          >
            {{ locale.t.orders.status[deal.order.status] }}
          </Badge>
        </div>

        <p v-if="deal.order.status === 'work_submitted'" class="text-sm text-muted-foreground">
          {{ locale.t.agent.workAwaitingClient }}
        </p>

        <div class="flex gap-2">
          <Button
            variant="outline"
            class="h-11 flex-1 rounded-2xl"
            @click="router.push(`/chat/${deal.order.id}`)"
          >
            <MessageCircle class="size-4" />
            {{ locale.t.chat.openChat }}
          </Button>
          <Button
            v-if="deal.order.status === 'in_progress'"
            class="h-11 flex-1 rounded-2xl"
            :disabled="orders.isSubmitting"
            @click="handleSubmitWork(deal.order.id)"
          >
            <Loader2 v-if="orders.isSubmitting" class="size-4 animate-spin" />
            <CheckCircle2 v-else class="size-4" />
            {{ locale.t.agent.submitWork }}
          </Button>
        </div>
      </GlassCard>
    </template>

    <div
      v-if="!hideOpportunitiesHeader"
      class="flex items-center justify-between px-1"
    >
      <h3 class="text-base font-semibold text-foreground">
        {{ locale.t.agent.orderOpportunities }}
      </h3>
      <span class="text-xs text-muted-foreground">{{ locale.t.agent.inYourCategories }}</span>
    </div>

    <template v-if="orders.isLoadingAgent && orders.availableOrders.length === 0">
      <Skeleton v-for="n in 2" :key="n" class="h-40 w-full rounded-3xl" />
    </template>

    <GlassCard v-else-if="orders.availableOrders.length === 0" padding="none" class="overflow-hidden">
      <EmptyState
        :icon="Inbox"
        :title="locale.t.agent.noOpenOrders"
        :description="locale.t.agent.noOpenOrdersBody"
      />
    </GlassCard>

    <template v-else>
      <AgentOrderItem
        v-for="order in orders.availableOrders"
        :key="order.id"
        :order="order"
        :submitting="orders.isSubmitting"
        :highlight="order.id === focusOrderId"
        @submit="handleSubmit"
      />
    </template>

    <p v-if="orders.error" class="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
      {{ orders.error }}
    </p>
  </div>
</template>
