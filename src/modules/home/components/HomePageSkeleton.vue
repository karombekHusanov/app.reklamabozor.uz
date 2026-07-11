<script setup lang="ts">
import Skeleton from '@/core/ui/Skeleton.vue'
import HomeAgentCardSkeleton from '@/modules/home/components/HomeAgentCardSkeleton.vue'
</script>

<template>
  <div class="pb-2" aria-busy="true" aria-label="Loading home">
    <!-- Top bar -->
    <header class="safe-top flex items-center justify-between gap-3 px-5 pt-3">
      <Skeleton class="size-11 rounded-2xl" />
      <Skeleton class="size-9 rounded-xl" />
      <Skeleton class="size-11 rounded-2xl" />
    </header>

    <!-- Profile card -->
    <section class="px-5 pt-4">
      <div class="home-card relative p-4">
        <Skeleton class="absolute right-4 top-4 h-5 w-16 rounded-full" />
        <div class="flex items-center gap-3.5">
          <Skeleton class="size-16 shrink-0 rounded-2xl" />
          <div class="min-w-0 flex-1 space-y-2">
            <Skeleton class="h-3 w-20 rounded-md" />
            <Skeleton class="h-5 w-32 max-w-full rounded-lg" />
            <Skeleton class="h-3 w-24 rounded-md" />
          </div>
        </div>
        <div class="mt-4 space-y-3">
          <div class="rounded-2xl bg-muted/55 p-3">
            <Skeleton class="h-3 w-28 rounded-md" />
            <div class="mt-2 flex gap-2">
              <Skeleton class="h-7 w-24 rounded-full" />
              <Skeleton class="h-7 w-28 rounded-full" />
            </div>
          </div>
          <Skeleton class="h-11 w-full rounded-full" />
        </div>
      </div>
    </section>

    <!-- Banner -->
    <div class="home-banner-carousel overflow-x-hidden pt-4">
      <div class="flex items-center justify-center gap-3.5 overflow-hidden">
        <Skeleton class="h-[154px] w-9 shrink-0 rounded-[28px] opacity-40" />
        <Skeleton class="h-[154px] w-[calc(100%-4.5rem)] shrink-0 rounded-[28px]" />
        <Skeleton class="h-[154px] w-9 shrink-0 rounded-[28px] opacity-40" />
      </div>
    </div>

    <!-- Quick links grid -->
    <section class="grid grid-cols-2 gap-4 px-5 pt-4">
      <div
        v-for="n in 4"
        :key="n"
        class="min-h-[148px] rounded-[28px] border border-border bg-card p-4 shadow-sm"
      >
        <div class="flex h-full flex-col items-start justify-between">
          <Skeleton class="size-13 rounded-[22px]" />
          <div class="w-full">
            <Skeleton class="h-4 w-24 rounded-md" />
            <Skeleton class="mt-2 h-3 w-22 rounded-md" />
            <Skeleton class="mt-1.5 h-3 w-16 rounded-md" />
          </div>
        </div>
      </div>
    </section>

    <!-- Top agents list -->
    <section class="px-5 pt-4">
      <div class="home-card overflow-hidden p-4">
        <div class="flex items-center justify-between pb-2">
          <Skeleton class="h-5 w-32 rounded-md" />
          <Skeleton class="h-4 w-20 rounded-md" />
        </div>
        <div class="divide-y divide-border">
          <HomeAgentCardSkeleton v-for="n in 4" :key="n" />
        </div>
      </div>
    </section>
  </div>
</template>
