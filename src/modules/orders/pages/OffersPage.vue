<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { useOrdersStore } from '@/modules/orders/stores/orders.store'
import AgentOrdersSection from '@/modules/agent/components/AgentOrdersSection.vue'

const locale = useLocaleStore()
const orders = useOrdersStore()
const route = useRoute()

const activeTab = ref<'orders' | 'offers'>('orders')

const focusOrderId = computed(() => {
  const raw = route.query.order
  const value = Array.isArray(raw) ? raw[0] : raw
  if (!value) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
})

const openCount = computed(() => orders.availableOrders.length)
const myOffersCount = computed(() => orders.myOffers.length)

// Subtitle follows the active tab: open opportunities vs. offers sent.
const subtitle = computed(() =>
  activeTab.value === 'orders'
    ? locale.t.agent.offersOpenCount.replace('{count}', String(openCount.value))
    : locale.t.agent.offersMineCount.replace('{count}', String(myOffersCount.value)),
)

const subtitleActive = computed(() =>
  activeTab.value === 'orders' ? openCount.value > 0 : myOffersCount.value > 0,
)
</script>

<template>
  <div>
    <AppHeader show-back>
      <template #heading>
        <div class="min-w-0 flex-1">
          <p class="truncate text-lg font-bold leading-tight text-foreground">
            {{ locale.t.agent.offersPageTitle }}
          </p>
          <p
            class="truncate text-xs font-medium"
            :class="subtitleActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'"
          >
            {{ subtitle }}
          </p>
        </div>
      </template>
    </AppHeader>

    <section class="px-5 pb-6 pt-1">
      <AgentOrdersSection
        v-model:tab="activeTab"
        :focus-order-id="focusOrderId"
      />
    </section>
  </div>
</template>
