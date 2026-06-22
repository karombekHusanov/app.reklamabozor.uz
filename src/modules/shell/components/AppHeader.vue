<script setup lang="ts">
import Avatar from '@/core/ui/Avatar.vue'
import type { HTMLAttributes } from 'vue'

withDefaults(defineProps<{
  class?: HTMLAttributes['class']
  title: string
  subtitle?: string
  showAvatar?: boolean
  userName?: string
}>(), {
  showAvatar: false,
})
</script>

<template>
  <header class="safe-top px-5 pb-4 pt-3">
    <div class="flex items-start justify-between gap-4">
      <div class="space-y-1">
        <p v-if="subtitle" class="text-sm text-muted-foreground">
          {{ subtitle }}
        </p>
        <h1 class="text-2xl font-semibold tracking-tight text-foreground">
          {{ title }}
        </h1>
      </div>

      <Avatar v-if="showAvatar" :name="userName" size="md" />
    </div>
  </header>
</template>
