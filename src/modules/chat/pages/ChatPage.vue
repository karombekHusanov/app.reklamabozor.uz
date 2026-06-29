<script setup lang="ts">
import { MessageCircle } from '@lucide/vue'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import EmptyState from '@/core/ui/EmptyState.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'

const locale = useLocaleStore()
</script>

<template>
  <div>
    <AppHeader :title="locale.t.shell.tabs.chat" :subtitle="locale.t.chat.subtitle" />

    <section class="px-5">
      <GlassCard padding="none" class="overflow-hidden">
        <EmptyState
          :icon="MessageCircle"
          :title="locale.t.chat.comingSoonTitle"
          :description="locale.t.chat.comingSoonBody"
        />
      </GlassCard>
    </section>
  </div>
</template>
