<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import PublicOfferDocument from '../components/PublicOfferDocument.vue'
import type { PublicOfferKind } from '../services/public-offer.service'

const locale = useLocaleStore()
const route = useRoute()

const kind = computed<PublicOfferKind>(() => (route.meta.offerKind as PublicOfferKind | undefined) ?? 'client')
</script>

<template>
  <div class="pb-6">
    <AppHeader
      :title="kind === 'agent' ? locale.t.legal.agentOfferTitle : locale.t.legal.offerTitle"
      :subtitle="kind === 'agent' ? locale.t.legal.agentOfferVersionLabel : locale.t.legal.offerVersionLabel"
      show-back
    />

    <div class="px-4">
      <PublicOfferDocument :kind="kind" />
    </div>
  </div>
</template>
