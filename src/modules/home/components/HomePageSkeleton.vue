<script setup lang="ts">
import Skeleton from '@/core/ui/Skeleton.vue'
import HomeAgentCardSkeleton from '@/modules/home/components/HomeAgentCardSkeleton.vue'
</script>

<template>
  <div class="relative" aria-busy="true" aria-label="Loading home">
    <!-- Hero -->
    <header
      class="rounded-b-[2rem] bg-gradient-to-br from-[#02305C] via-[#014BA4] to-[#0386D9] px-5 pb-8 pt-[max(env(safe-area-inset-top),0.75rem)]"
    >
      <div class="flex items-center justify-between">
        <Skeleton class="size-10 rounded-xl bg-white/20" />
        <Skeleton class="h-9 w-28 rounded-full bg-white/20" />
      </div>

      <div class="mt-4 flex items-center justify-center gap-2">
        <Skeleton class="size-2 rounded-full bg-white/20" />
        <Skeleton class="h-4 w-48 rounded-md bg-white/20" />
      </div>

      <div class="mt-5 flex items-start gap-4">
        <div class="flex shrink-0 flex-col items-center gap-2.5">
          <Skeleton class="size-16 rounded-2xl bg-white/20" />
          <Skeleton class="h-3 w-16 rounded-md bg-white/15" />
          <Skeleton class="h-3 w-14 rounded-md bg-white/15" />
        </div>
        <div class="min-w-0 flex-1 space-y-2 pt-1">
          <Skeleton class="h-4 w-24 rounded-md bg-white/15" />
          <Skeleton class="h-6 w-44 max-w-full rounded-lg bg-white/20" />
          <Skeleton class="h-3.5 w-36 rounded-md bg-white/15" />
        </div>
      </div>
    </header>

    <!-- Banner -->
    <div class="relative z-10 -mt-3 px-5">
      <Skeleton class="home-card aspect-[16/7] w-full" />
      <div class="mt-2.5 flex items-center justify-center gap-1.5">
        <Skeleton class="h-1.5 w-4 rounded-full bg-white/30" />
        <Skeleton class="h-1.5 w-1.5 rounded-full bg-white/20" />
        <Skeleton class="h-1.5 w-1.5 rounded-full bg-white/20" />
      </div>
    </div>

    <!-- Cards -->
    <section class="space-y-3 px-5 pb-2 pt-4">
      <!-- Primary CTA card -->
      <div class="home-card space-y-4 p-5">
        <Skeleton class="size-14 rounded-2xl bg-[#0386D9]/15" />
        <Skeleton class="h-5 w-[60%] max-w-full rounded-lg bg-[#0386D9]/20" />
        <div class="space-y-2">
          <Skeleton class="h-3.5 w-full rounded-md bg-[#0386D9]/15" />
          <Skeleton class="h-3.5 w-[92%] rounded-md bg-[#0386D9]/15" />
        </div>
        <Skeleton class="h-4 w-32 rounded-md bg-[#0386D9]/20" />
      </div>

      <!-- Secondary tiles -->
      <div class="grid grid-cols-2 gap-3">
        <div class="home-card space-y-3 p-4">
          <Skeleton class="size-12 rounded-xl bg-[#0386D9]/15" />
          <Skeleton class="h-4 w-[80%] rounded-md bg-[#0386D9]/20" />
          <Skeleton class="h-3 w-full rounded-md bg-[#0386D9]/15" />
        </div>
        <div class="home-card space-y-3 p-4">
          <Skeleton class="size-12 rounded-xl bg-[#0386D9]/15" />
          <Skeleton class="h-4 w-[60%] rounded-md bg-[#0386D9]/20" />
          <Skeleton class="h-3 w-full rounded-md bg-[#0386D9]/15" />
        </div>
      </div>

      <!-- Top agents list -->
      <div class="home-card overflow-hidden p-4">
        <div class="flex items-center justify-between pb-2">
          <Skeleton class="h-5 w-32 rounded-md bg-[#0386D9]/15" />
          <Skeleton class="h-4 w-20 rounded-md bg-[#0386D9]/10" />
        </div>
        <div class="divide-y divide-[#0386D9]/10">
          <HomeAgentCardSkeleton v-for="n in 4" :key="n" />
        </div>
      </div>
    </section>
  </div>
</template>
