<script setup lang="ts">
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import ComingSoonPlaceholder from '@/core/ui/ComingSoonPlaceholder.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'

const locale = useLocaleStore()
</script>

<template>
  <div class="pb-6">
    <AppHeader
      :title="locale.t.tender.title"
      show-back
    />

    <section class="px-5">
      <ComingSoonPlaceholder :title="locale.t.tender.comingSoonTitle" />
    </section>
  </div>
</template>
