<script setup lang="ts">
import Skeleton from '@/core/ui/Skeleton.vue'
</script>

<template>
  <div class="flex items-center gap-3 py-3">
    <Skeleton class="top-agents-skeleton size-6 shrink-0 rounded-full" />
    <Skeleton class="top-agents-skeleton size-11 shrink-0 rounded-full" />
    <div class="min-w-0 flex-1 space-y-2">
      <Skeleton class="top-agents-skeleton--strong h-4 w-28 max-w-full rounded-md" />
      <Skeleton class="top-agents-skeleton h-3 w-20 rounded-md" />
    </div>
    <div class="flex flex-col items-end gap-1.5">
      <Skeleton class="top-agents-skeleton--strong h-4 w-10 rounded-md" />
      <Skeleton class="top-agents-skeleton h-3 w-14 rounded-md" />
    </div>
  </div>
</template>
