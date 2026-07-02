<script setup lang="ts">
import Skeleton from '@/core/ui/Skeleton.vue'
</script>

<template>
  <div class="flex items-center gap-3 py-3">
    <Skeleton class="size-6 shrink-0 rounded-full bg-[#0386D9]/10" />
    <Skeleton class="size-11 shrink-0 rounded-full bg-[#0386D9]/10" />
    <div class="min-w-0 flex-1 space-y-2">
      <Skeleton class="h-4 w-28 max-w-full rounded-md bg-[#0386D9]/15" />
      <Skeleton class="h-3 w-20 rounded-md bg-[#0386D9]/10" />
    </div>
    <div class="flex flex-col items-end gap-1.5">
      <Skeleton class="h-4 w-10 rounded-md bg-[#0386D9]/15" />
      <Skeleton class="h-3 w-14 rounded-md bg-[#0386D9]/10" />
    </div>
  </div>
</template>
