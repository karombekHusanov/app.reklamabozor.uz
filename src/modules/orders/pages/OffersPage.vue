<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import AgentOrdersSection from '@/modules/agent/components/AgentOrdersSection.vue'

const locale = useLocaleStore()
const route = useRoute()

const focusOrderId = computed(() => {
  const raw = route.query.order
  const value = Array.isArray(raw) ? raw[0] : raw
  if (!value) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
})
</script>

<template>
  <div>
    <AppHeader
      :title="locale.t.home.menuOffers"
      :subtitle="locale.t.home.openOrdersBody"
      show-back
    />

    <section class="px-5 pb-6">
      <AgentOrdersSection :focus-order-id="focusOrderId" />
    </section>
  </div>
</template>
