<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  icon?: Component
  title: string
  description?: string
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-3.5 px-6 py-14 text-center">
    <div
      v-if="icon"
      class="grid size-16 place-items-center rounded-[var(--rb-r-tile)] bg-secondary text-primary"
    >
      <component
        :is="icon"
        class="size-7"
      />
    </div>
    <div class="space-y-1.5">
      <p class="rb-font-display text-[17px] font-extrabold tracking-[-0.01em] text-foreground">
        {{ title }}
      </p>
      <p
        v-if="description"
        class="mx-auto max-w-xs text-[13px] leading-relaxed text-muted-foreground"
      >
        {{ description }}
      </p>
    </div>
    <slot />
  </div>
</template>
