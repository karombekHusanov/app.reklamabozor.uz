<script setup lang="ts">
import Avatar from '@/core/ui/Avatar.vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import TelegramLoginButton from '@/modules/auth/components/TelegramLoginButton.vue'

defineProps<{
  title: string
  body: string
  error?: string | null
}>()
</script>

<template>
  <GlassCard class="space-y-4 text-center">
    <Avatar name="Guest" size="lg" class="mx-auto" />
    <div class="space-y-2">
      <h2 class="text-xl font-semibold">
        {{ title }}
      </h2>
      <p class="text-sm leading-relaxed text-muted-foreground">
        {{ body }}
      </p>
    </div>
    <TelegramLoginButton />
    <p
      v-if="error"
      class="rounded-2xl bg-destructive/10 px-3 py-2 text-left text-xs text-destructive"
    >
      {{ error }}
    </p>
  </GlassCard>
</template>
