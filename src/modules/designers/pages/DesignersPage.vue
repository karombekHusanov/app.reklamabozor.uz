<script setup lang="ts">
import { Brush } from '@lucide/vue'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import EmptyState from '@/core/ui/EmptyState.vue'
</script>

<template>
  <div>
    <AppHeader
      title="Designers"
      subtitle="Creative studios & freelancers"
    />

    <section class="px-5">
      <GlassCard padding="none" class="overflow-hidden">
        <EmptyState
          :icon="Brush"
          title="Designers coming soon"
          description="Verified designer profiles will appear here once the design marketplace goes live."
        />
      </GlassCard>
    </section>
  </div>
</template>
