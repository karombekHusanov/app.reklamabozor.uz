<script setup lang="ts">
import Skeleton from '@/core/ui/Skeleton.vue'
import HomeAgentCardSkeleton from '@/modules/home/components/HomeAgentCardSkeleton.vue'
</script>

<template>
  <div class="pb-2" aria-busy="true" aria-label="Loading home">
    <!-- Top bar -->
    <header class="safe-top flex items-center justify-between gap-3 px-5 pt-3">
      <Skeleton class="size-11 rounded-2xl" />
      <Skeleton class="h-9 w-32 rounded-xl" />
      <Skeleton class="size-11 rounded-2xl" />
    </header>

    <!-- Profile card -->
    <section class="px-5 pt-4">
      <div class="home-card p-4">
        <div class="flex items-start gap-3.5">
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
    <div class="overflow-x-hidden pt-4">
      <div class="flex gap-3.5 overflow-hidden px-5">
        <div class="min-w-[calc(100%-4.5rem)] rounded-[28px] bg-slate-300/70 p-3.5 dark:bg-slate-800/70">
          <div class="flex min-h-[154px] flex-col gap-3">
            <div class="flex items-start gap-2.5">
              <div class="flex min-w-0 flex-1 flex-col">
                <Skeleton class="h-6 w-[54%] rounded-lg bg-white/60 dark:bg-white/18" />
                <Skeleton class="mt-2 h-3 w-[62%] rounded-md bg-white/45 dark:bg-white/14" />
                <Skeleton class="mt-1 h-3 w-[42%] rounded-md bg-white/45 dark:bg-white/14" />
              </div>
            </div>
            <Skeleton class="mt-auto h-9 w-24 rounded-full bg-white/60 dark:bg-white/18" />
          </div>
        </div>
        <div class="min-w-[calc(100%-4.5rem)] rounded-[28px] bg-slate-300/45 p-3.5 opacity-60 dark:bg-slate-800/45">
          <div class="flex min-h-[154px] flex-col gap-3">
            <div class="flex items-start gap-2.5">
              <div class="flex min-w-0 flex-1 flex-col">
                <Skeleton class="h-6 w-[48%] rounded-lg bg-white/60 dark:bg-white/18" />
                <Skeleton class="mt-2 h-3 w-[58%] rounded-md bg-white/45 dark:bg-white/14" />
              </div>
            </div>
            <Skeleton class="mt-auto h-9 w-24 rounded-full bg-white/60 dark:bg-white/18" />
          </div>
        </div>
      </div>
    </div>

    <!-- Quick links grid -->
    <section class="grid grid-cols-2 gap-4 px-5 pt-4">
      <div
        v-for="n in 4"
        :key="n"
        class="relative min-h-[148px] overflow-hidden rounded-[28px] border border-white/65 bg-gradient-to-br from-sky-100 via-cyan-50 to-teal-100 p-4 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.35)] dark:border-white/10 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800"
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
