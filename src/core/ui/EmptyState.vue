<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  icon?: Component
  title: string
  description?: string
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
    <div
      v-if="icon"
      class="flex size-14 items-center justify-center rounded-3xl bg-muted text-muted-foreground dark:bg-white/5"
    >
      <component :is="icon" class="size-7" />
    </div>
    <div class="space-y-1">
      <p class="font-medium">
        {{ title }}
      </p>
      <p v-if="description" class="mx-auto max-w-xs text-sm leading-relaxed text-muted-foreground">
        {{ description }}
      </p>
    </div>
    <slot />
  </div>
</template>
