<script setup lang="ts">
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import PublicOfferDocument from '../components/PublicOfferDocument.vue'

const locale = useLocaleStore()
</script>

<template>
  <div class="pb-6">
    <AppHeader
      :title="locale.t.legal.offerTitle"
      :subtitle="locale.t.legal.offerVersionLabel"
      show-back
    />

    <div class="px-4">
      <PublicOfferDocument />
    </div>
  </div>
</template>
