<script setup lang="ts">
import { Brush } from '@lucide/vue'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import EmptyState from '@/core/ui/EmptyState.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'

const locale = useLocaleStore()
</script>

<template>
  <div>
    <AppHeader
      :title="locale.t.designers.title"
      :subtitle="locale.t.designers.subtitle"
      show-back
    />

    <section class="px-5">
      <GlassCard padding="none" class="overflow-hidden">
        <EmptyState
          :icon="Brush"
          :title="locale.t.designers.comingSoonTitle"
          :description="locale.t.designers.comingSoonBody"
        />
      </GlassCard>
    </section>
  </div>
</template>
