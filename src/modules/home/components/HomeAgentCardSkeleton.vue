<script setup lang="ts">
import Skeleton from '@/core/ui/Skeleton.vue'
import { cn } from '@/core/lib/utils'
import type { HTMLAttributes } from 'vue'

defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div :class="cn('rounded-2xl border border-white/30 bg-white p-4 shadow-md', $props.class)">
    <div class="flex items-start gap-3">
      <Skeleton class="size-16 shrink-0 rounded-2xl bg-[#0386D9]/10" />
      <div class="min-w-0 flex-1 space-y-2.5 pt-0.5">
        <Skeleton class="h-4 w-[80%] rounded-md bg-[#0386D9]/10" />
        <Skeleton class="h-3 w-1/2 rounded-md bg-[#0386D9]/10" />
        <Skeleton class="h-6 w-14 rounded-full bg-[#0386D9]/10" />
      </div>
    </div>
  </div>
</template>
