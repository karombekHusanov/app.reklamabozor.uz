<script setup lang="ts">
import GlassCard from '@/core/ui/GlassCard.vue'
import { ArrowRight, Sparkles } from '@lucide/vue'

defineProps<{
  title: string
  description: string
  action?: string
}>()

const emit = defineEmits<{
  click: []
}>()
</script>

<template>
  <GlassCard interactive class="group cursor-pointer" @click="emit('click')">
    <div class="flex items-start justify-between gap-4">
      <div class="space-y-2">
        <div class="inline-flex items-center gap-2 text-sm font-medium text-primary">
          <Sparkles class="size-4" />
          Quick action
        </div>
        <h3 class="text-lg font-semibold">{{ title }}</h3>
        <p class="text-sm leading-relaxed text-muted-foreground">
          {{ description }}
        </p>
      </div>
      <div class="rounded-2xl bg-white/50 p-2 text-muted-foreground transition group-hover:translate-x-0.5 dark:bg-white/10">
        <ArrowRight class="size-5" />
      </div>
    </div>
    <p v-if="action" class="mt-4 text-sm font-medium text-primary">
      {{ action }}
    </p>
  </GlassCard>
</template>
