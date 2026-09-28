<script setup lang="ts">
import { computed, ref } from 'vue'
import Drawer from '@/core/ui/Drawer.vue'
import { useTelegram } from '@/core/composables/useTelegram'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { INFO_TOPICS } from '@/modules/home/lib/info-topics'

/** "Learn PRB" tiles; each opens a sheet, "Next" walks through all topics. */
const locale = useLocaleStore()
const { haptic } = useTelegram()

const topics = computed(() => INFO_TOPICS.map(topic => ({ ...topic, ...locale.t.clientHome.info[topic.id] })))

const active = ref(-1)
const open = computed({
  get: () => active.value >= 0,
  set: (value) => { if (!value) active.value = -1 },
})
const current = computed(() => topics.value[active.value] ?? null)
const isLast = computed(() => active.value === topics.value.length - 1)

function show(index: number) {
  haptic('light')
  active.value = index
}

function next() {
  haptic('light')
  active.value = isLast.value ? -1 : active.value + 1
}
</script>

<template>
  <!-- eslint-disable vue/no-v-html -- the SVG art is static markup from info-topics.ts -->
  <section class="cit">
    <button
      v-for="(topic, i) in topics"
      :key="topic.id"
      type="button"
      class="cit__tile"
      :class="[topic.tone && `cit__tile--${topic.tone}`, { 'cit__tile--wide': topic.wide }]"
      @click="show(i)"
    >
      <span class="cit__text">
        <span
          v-if="'chip' in topic"
          class="cit__chip"
        >{{ topic.chip }}</span>
        <span class="cit__title">{{ topic.tile }}</span>
        <span
          v-if="'sub' in topic"
          class="cit__sub"
        >{{ topic.sub }}</span>
      </span>
      <svg
        class="cit__art"
        viewBox="0 0 120 100"
        aria-hidden="true"
        v-html="topic.art"
      />
    </button>
  </section>

  <Drawer
    v-model:open="open"
    :title="current?.title"
    :show-close="false"
    hide-title
  >
    <div
      v-if="current"
      class="cit-sheet"
    >
      <svg
        class="cit-sheet__art"
        viewBox="0 0 120 100"
        aria-hidden="true"
        v-html="current.art"
      />
      <h2 class="cit-sheet__title">
        {{ current.title }}
      </h2>
      <p class="cit-sheet__p">
        {{ current.p1 }}
      </p>
      <p class="cit-sheet__p">
        {{ current.p2 }}
      </p>
      <button
        type="button"
        class="cit-sheet__btn"
        :class="{ 'is-last': isLast }"
        @click="next"
      >
        {{ isLast ? locale.t.clientHome.gotIt : locale.t.clientHome.next }}
      </button>
    </div>
  </Drawer>
</template>

<style scoped>
.cit { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.cit__tile {
  display: flex; min-height: 150px; flex-direction: column; justify-content: space-between; gap: 6px; padding: 14px 12px 10px 14px;
  border: 0; border-radius: 22px; background: var(--card); box-shadow: var(--rb-elev-1); color: var(--foreground); font-family: inherit; text-align: left; cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.cit__tile:active { transform: scale(0.98); }
.cit__tile:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
.cit__tile--tezkor { background: color-mix(in srgb, var(--rb-cta) 12%, var(--card)); }
.cit__tile--tender { background: var(--secondary); }
.cit__tile--wide { grid-column: span 2; min-height: 130px; flex-direction: row; align-items: center; }
.cit__text { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; }
.cit__chip { padding: 2px 8px; border-radius: var(--rb-r-chip); background: var(--card); font-size: 11px; font-weight: 700; }
.cit__tile--tezkor .cit__chip { color: var(--rb-cta-strong); }
.cit__tile--tender .cit__chip { color: var(--secondary-foreground); }
.cit__title { font-size: 15px; font-weight: 500; line-height: 1.25; }
.cit__sub { font-size: 12.5px; line-height: 1.45; color: var(--muted-foreground); }
.cit__art { width: 84px; height: 70px; flex-shrink: 0; align-self: flex-end; }
.cit__tile--wide .cit__art { width: 96px; height: 80px; align-self: center; }
.cit__art, .cit-sheet__art { fill: none; stroke: #101828; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }
:global(.dark) .cit__art, :global(.dark) .cit-sheet__art { filter: invert(1); }
.cit-sheet { display: flex; flex-direction: column; padding: 0 4px 4px; }
.cit-sheet__art { align-self: center; width: 200px; height: 166px; margin-bottom: 12px; }
.cit-sheet__title { margin: 0; font-size: 22px; font-weight: 600; line-height: 1.2; letter-spacing: -0.01em; }
.cit-sheet__p { margin: 10px 0 0; font-size: 14.5px; line-height: 1.5; }
.cit-sheet__btn {
  margin-top: 22px; min-height: 50px; border: 0; border-radius: 16px; background: linear-gradient(180deg, var(--rb-cta) 0%, var(--rb-cta-strong) 100%); color: #fff;
  box-shadow: var(--rb-elev-cta);
  font-family: inherit; font-size: 15px; font-weight: 600; cursor: pointer;
}
.cit-sheet__btn.is-last { background: var(--muted); color: var(--foreground); box-shadow: none; }
.cit-sheet__btn:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
</style>
