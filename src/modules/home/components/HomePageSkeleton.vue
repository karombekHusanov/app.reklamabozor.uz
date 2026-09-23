<script setup lang="ts">
import Skeleton from '@/core/ui/Skeleton.vue'

/**
 * Mirrors the first screens of HomePage: brand hero (greeting, tri-vision
 * billboard, search, trust pill) → sheet with stat trio → "Your desk" 2×2 →
 * the dark Safe-deal card. Hero blocks use the default translucent white;
 * sheet blocks use `--secondary` so they read on the neutral canvas.
 */
const SHEET = 'bg-[var(--secondary)] dark:bg-[var(--secondary)]'
</script>

<template>
  <div
    class="sk"
    aria-busy="true"
    aria-label="Loading home"
  >
    <header class="sk-hero brand-hero safe-top">
      <div class="sk-hero__greet">
        <Skeleton class="size-11 shrink-0 rounded-full" />
        <div class="min-w-0 flex-1 space-y-1.5">
          <Skeleton class="h-3 w-20 rounded-md" />
          <Skeleton class="h-4 w-32 rounded-md" />
        </div>
        <Skeleton class="size-[42px] shrink-0 rounded-[13px]" />
        <Skeleton class="size-[42px] shrink-0 rounded-[13px]" />
      </div>

      <div class="sk-hero__board">
        <Skeleton class="sk-hero__screen rounded-[9px]" />
        <span class="sk-hero__post" />
      </div>

      <Skeleton class="mt-2.5 h-[54px] w-full rounded-2xl" />
      <Skeleton class="mt-3 h-11 w-full rounded-full" />
    </header>

    <div class="sk-sheet">
      <div class="sk-stats">
        <Skeleton class="h-[52px] w-full rounded-2xl border border-[var(--border)] bg-[var(--card)] dark:bg-[var(--card)]" />
      </div>

      <div class="sk-feats">
        <Skeleton
          v-for="n in 2"
          :key="n"
          :class="['h-[170px] rounded-[18px]', SHEET]"
        />
      </div>

      <section class="sk-block">
        <Skeleton :class="['h-3 w-28 rounded-md', SHEET]" />
        <Skeleton :class="['mt-2 h-5 w-44 rounded-md', SHEET]" />
        <div class="sk-grid">
          <Skeleton
            v-for="n in 4"
            :key="n"
            :class="['h-[118px] rounded-[18px]', SHEET]"
          />
        </div>
      </section>

      <section class="sk-block">
        <div class="sk-vault brand-hero">
          <Skeleton class="h-6 w-32 rounded-full" />
          <Skeleton class="mt-3 h-6 w-4/5 rounded-md" />
          <Skeleton class="mt-2 h-6 w-3/5 rounded-md" />
          <div class="sk-vault__path">
            <Skeleton class="size-[46px] rounded-[15px]" />
            <Skeleton class="size-16 rounded-[20px]" />
            <Skeleton class="size-[46px] rounded-[15px]" />
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.sk { --gutter: 24px; display: flex; min-height: 100%; flex-direction: column; }

.sk-hero {
  padding: calc(max(env(safe-area-inset-top), 0.5rem) + 0.4rem) var(--gutter) 4.5rem;
}
.sk-hero__greet { display: flex; align-items: center; gap: 12px; padding: 8px 0 18px; }
.sk-hero__board { max-width: 360px; margin: 18px auto 0; }
.sk-hero__screen { aspect-ratio: 2.85 / 1; width: 100%; height: auto; }
.sk-hero__post {
  display: block; width: 16px; height: 26px; margin: 0 auto;
  background: rgba(255, 255, 255, 0.18);
  -webkit-mask: linear-gradient(#000 30%, transparent);
  mask: linear-gradient(#000 30%, transparent);
}

.sk-sheet {
  position: relative; z-index: 2; margin-top: -2rem; padding-bottom: 1.5rem;
  background: var(--background); border-radius: 26px 26px 0 0;
}
.sk-stats { position: relative; z-index: 3; padding-inline: var(--gutter); margin-top: -1.6rem; }
.sk-block { padding: 1.6rem var(--gutter) 0; }
.sk-feats { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 1rem var(--gutter) 0; }
.sk-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 13px; }

.sk-vault { padding: 20px 18px; border-radius: var(--rb-r-card); }
.sk-vault__path { display: flex; align-items: center; justify-content: space-between; margin-top: 22px; padding-inline: 8px; }
</style>
