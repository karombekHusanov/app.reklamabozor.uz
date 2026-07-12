<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Radio } from '@lucide/vue'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { useOrdersStore } from '@/modules/orders/stores/orders.store'
import AgentOrdersSection from '@/modules/agent/components/AgentOrdersSection.vue'

const locale = useLocaleStore()
const orders = useOrdersStore()
const route = useRoute()

const focusOrderId = computed(() => {
  const raw = route.query.order
  const value = Array.isArray(raw) ? raw[0] : raw
  if (!value) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
})

const openCount = computed(() => orders.availableOrders.length)

const liveCountLabel = computed(() =>
  locale.t.agent.offersOpenCount.replace('{count}', String(openCount.value)),
)
</script>

<template>
  <div>
    <AppHeader show-back>
      <template #heading>
        <p class="truncate text-lg font-bold leading-tight text-foreground">
          {{ locale.t.agent.offersPageTitle }}
        </p>
      </template>
    </AppHeader>

    <section class="px-5 pb-6">
      <div class="offers-radar-hero">
        <div
          class="offers-radar-hero__rings"
          aria-hidden="true"
        >
          <span class="offers-radar-hero__ring offers-radar-hero__ring--outer" />
          <span class="offers-radar-hero__ring offers-radar-hero__ring--mid" />
          <span class="offers-radar-hero__ring offers-radar-hero__ring--inner" />
          <span class="offers-radar-hero__core">
            <Radio class="size-4" />
          </span>
        </div>

        <div class="min-w-0 flex-1">
          <p class="offers-radar-hero__eyebrow">
            {{ locale.t.agent.offersRadarEyebrow }}
          </p>
          <h1 class="offers-radar-hero__title">
            {{ locale.t.agent.orderOpportunities }}
          </h1>
          <p class="offers-radar-hero__subtitle">
            {{ locale.t.agent.inYourCategories }}
          </p>

          <span
            class="offers-radar-hero__chip"
            :class="openCount > 0 && 'offers-radar-hero__chip--live'"
          >
            <span
              class="offers-radar-hero__dot"
              aria-hidden="true"
            />
            {{ liveCountLabel }}
          </span>
        </div>
      </div>

      <AgentOrdersSection
        :focus-order-id="focusOrderId"
        hide-opportunities-header
      />
    </section>
  </div>
</template>
