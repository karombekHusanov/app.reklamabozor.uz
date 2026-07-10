<script setup lang="ts">
import { Check } from '@lucide/vue'
import { cn } from '@/core/lib/utils'

defineProps<{
  /** Zero-based index of the active step. */
  current: number
  /** Short label per step, in order. */
  steps: string[]
}>()
</script>

<template>
  <div class="flex items-start">
    <template
      v-for="(label, i) in steps"
      :key="i"
    >
      <!-- Node -->
      <div class="flex w-0 grow flex-col items-center gap-1.5">
        <div
          :class="cn(
            'flex size-8 items-center justify-center rounded-full text-sm font-semibold transition-colors',
            i < current && 'bg-primary text-primary-foreground',
            i === current && 'bg-primary text-primary-foreground ring-4 ring-primary/15',
            i > current && 'bg-muted text-muted-foreground',
          )"
        >
          <Check
            v-if="i < current"
            class="size-4"
          />
          <span v-else>{{ i + 1 }}</span>
        </div>
        <span
          :class="cn(
            'text-center text-[11px] leading-tight',
            i <= current ? 'font-medium text-foreground' : 'text-muted-foreground',
          )"
        >
          {{ label }}
        </span>
      </div>

      <!-- Connector -->
      <div
        v-if="i < steps.length - 1"
        :class="cn(
          'mt-4 h-0.5 w-4 shrink-0 rounded-full transition-colors',
          i < current ? 'bg-primary' : 'bg-border',
        )"
      />
    </template>
  </div>
</template>
