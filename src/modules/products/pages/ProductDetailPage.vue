<script setup lang="ts">
import { ShoppingBag } from '@lucide/vue'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import EmptyState from '@/core/ui/EmptyState.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'

// Route param reserved for the upcoming marketplace product feature.
defineProps<{ id: string }>()

const locale = useLocaleStore()
</script>

<template>
  <div>
    <AppHeader :title="locale.t.products.title" :subtitle="locale.t.products.subtitle" show-back />

    <section class="px-5">
      <GlassCard padding="none" class="overflow-hidden">
        <EmptyState
          :icon="ShoppingBag"
          :title="locale.t.products.comingSoonTitle"
          :description="locale.t.products.comingSoonBody"
        />
      </GlassCard>
    </section>
  </div>
</template>
