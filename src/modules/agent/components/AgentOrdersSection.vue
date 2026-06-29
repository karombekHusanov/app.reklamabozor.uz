<script setup lang="ts">
import { Inbox } from '@lucide/vue'
import { nextTick, onMounted, watch } from 'vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import EmptyState from '@/core/ui/EmptyState.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import { useTelegram } from '@/core/composables/useTelegram'
import { useLocaleStore } from '@/core/i18n/locale.store'
import AgentOrderItem from '@/modules/agent/components/AgentOrderItem.vue'
import { useOrdersStore } from '@/modules/orders/stores/orders.store'
import type { CreateOfferPayload } from '@/modules/orders/types/order'

const locale = useLocaleStore()

const props = defineProps<{
  /** Deep-link target — scroll to and highlight this order once loaded. */
  focusOrderId?: number | null
}>()

const orders = useOrdersStore()
const { haptic } = useTelegram()

onMounted(() => orders.loadAgentWorkspace())

// Scroll the deep-linked order into view once the list has loaded.
watch(
  [() => orders.availableOrders, () => props.focusOrderId],
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
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between px-1">
      <h3 class="text-base font-semibold text-white">
        {{ locale.t.agent.orderOpportunities }}
      </h3>
      <span class="text-xs text-white/70">{{ locale.t.agent.inYourCategories }}</span>
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
