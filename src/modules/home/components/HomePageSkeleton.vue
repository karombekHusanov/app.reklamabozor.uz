<script setup lang="ts">
import Skeleton from '@/core/ui/Skeleton.vue'
import HomeAgentCardSkeleton from '@/modules/home/components/HomeAgentCardSkeleton.vue'
</script>

<template>
  <div
    class="home-page"
    aria-busy="true"
    aria-label="Loading home"
  >
    <header class="home-topbar safe-top">
      <div class="home-topbar__chrome">
        <Skeleton class="size-11 shrink-0 rounded-2xl" />
        <Skeleton class="size-9 shrink-0 rounded-xl" />
        <Skeleton class="size-11 shrink-0 rounded-2xl" />
      </div>
      <div class="home-topbar__identity-row">
        <Skeleton class="size-11 shrink-0 rounded-full" />
        <div class="min-w-0 flex-1 space-y-1.5">
          <Skeleton class="h-6 w-40 max-w-full rounded-lg" />
          <Skeleton class="h-3.5 w-28 rounded-md" />
        </div>
      </div>
    </header>

    <div class="home-banner-carousel px-5 pt-3">
      <Skeleton class="h-[154px] w-full rounded-[1.35rem]" />
    </div>

    <section class="home-action-dock">
      <Skeleton class="h-[4.75rem] w-full rounded-[1.5rem]" />
      <div class="home-action-dock__row">
        <Skeleton class="h-[7rem] flex-1 rounded-[1.5rem]" />
        <Skeleton class="h-[7rem] flex-1 rounded-[1.5rem]" />
      </div>
    </section>

    <section class="home-action-dock">
      <Skeleton class="h-[4.75rem] w-full rounded-[1.5rem]" />
      <div class="home-action-dock__pair">
        <Skeleton class="h-[7.25rem] rounded-[1.5rem]" />
        <Skeleton class="h-[7.25rem] rounded-[1.5rem]" />
      </div>
      <div class="home-action-dock__trio">
        <Skeleton
          v-for="n in 3"
          :key="n"
          class="h-[5.5rem] rounded-[1.5rem]"
        />
      </div>
    </section>

    <section class="home-stack overflow-x-hidden px-5">
      <div class="app-section__header">
        <Skeleton class="h-5 w-36 rounded-md" />
        <Skeleton class="h-4 w-20 rounded-md" />
      </div>
      <div class="flex gap-3">
        <Skeleton class="h-[8.5rem] w-[78%] shrink-0 rounded-[1.35rem]" />
        <Skeleton class="h-[8.5rem] w-[78%] shrink-0 rounded-[1.35rem]" />
      </div>
    </section>

    <section class="home-stack px-5">
      <div class="app-section__header">
        <Skeleton class="h-5 w-32 rounded-md" />
        <Skeleton class="h-4 w-20 rounded-md" />
      </div>
      <div class="app-list">
        <HomeAgentCardSkeleton
          v-for="n in 3"
          :key="`a-${n}`"
          class="px-4"
        />
      </div>
    </section>

    <section class="home-stack px-5 pb-2">
      <div class="app-section__header">
        <Skeleton class="h-5 w-32 rounded-md" />
        <Skeleton class="h-4 w-20 rounded-md" />
      </div>
      <div class="app-list">
        <HomeAgentCardSkeleton
          v-for="n in 3"
          :key="`d-${n}`"
          class="px-4"
        />
      </div>
    </section>
  </div>
</template>
