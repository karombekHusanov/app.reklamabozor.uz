<script setup lang="ts">
import GlassCard from '@/core/ui/GlassCard.vue'

defineProps<{
  title?: string
  subtitle?: string
}>()
</script>

<template>
  <GlassCard
    padding="none"
    class="profile-form-section"
  >
    <div
      v-if="title || subtitle"
      class="profile-form-section__header"
    >
      <h3
        v-if="title"
        class="profile-form-section__title"
      >
        {{ title }}
      </h3>
      <p
        v-if="subtitle"
        class="profile-form-section__subtitle"
      >
        {{ subtitle }}
      </p>
    </div>

    <div class="profile-form-section__body">
      <slot />
    </div>
  </GlassCard>
</template>
