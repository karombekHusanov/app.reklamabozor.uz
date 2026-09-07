<script setup lang="ts">
import { useLocaleStore } from '@/core/i18n/locale.store'
import { categoryName } from '@/core/i18n/category-name'
import { categoryIcon } from '@/modules/orders/lib/category-icon'
import type { Category } from '@/modules/agent/types/agent'

defineProps<{
  categories: Category[]
}>()

const emit = defineEmits<{
  select: [category: Category]
  viewAll: []
}>()

const locale = useLocaleStore()
</script>

<template>
  <section
    v-if="categories.length"
    aria-label="Browse by service"
  >
    <div class="sec-head">
      <h2 class="sec-title">
        {{ locale.t.home.browseByService }}
      </h2>
      <button
        type="button"
        class="sec-link"
        @click="emit('viewAll')"
      >
        {{ locale.t.home.viewAllAgents }} →
      </button>
    </div>

    <div class="rail">
      <button
        v-for="cat in categories"
        :key="cat.id"
        type="button"
        class="cat"
        @click="emit('select', cat)"
      >
        <span class="cat__ic">
          <component
            :is="categoryIcon(cat)"
            class="size-[26px]"
          />
        </span>
        <span class="cat__l">{{ categoryName(cat, locale.locale) }}</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.sec-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 13px; padding-inline: var(--home-gutter, 18px); }
.sec-title { font-family: var(--rb-font-display); font-weight: 800; font-size: 18px; letter-spacing: -0.015em; margin: 0; color: var(--foreground); }
.sec-link { font-size: 12.5px; font-weight: 700; color: var(--primary); background: none; border: 0; cursor: pointer; padding: 0; white-space: nowrap; -webkit-tap-highlight-color: transparent; }

.rail {
  display: flex; gap: 10px; overflow-x: auto;
  padding: 2px var(--home-gutter, 18px) 4px;
  /* without this the snap point ignores the gutter and eats the left padding */
  scroll-padding-inline: var(--home-gutter, 18px);
  scroll-snap-type: x proximity; scrollbar-width: none;
}
.rail::-webkit-scrollbar { display: none; }
.cat { scroll-snap-align: start; flex: 0 0 auto; width: 80px; display: flex; flex-direction: column; align-items: center; gap: 8px; background: none; border: 0; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.cat__ic { width: 66px; height: 66px; border-radius: 20px; display: grid; place-items: center; background: var(--card); border: 1px solid var(--border); color: var(--primary); box-shadow: var(--rb-elev-1); transition: transform var(--rb-dur) var(--rb-ease), border-color var(--rb-dur) var(--rb-ease); }
.cat:active .cat__ic { transform: scale(0.93); }
.cat:focus-visible { outline: none; }
.cat:focus-visible .cat__ic { outline: 2px solid var(--primary); outline-offset: 2px; }
.cat__l { font-size: 11.5px; font-weight: 600; color: var(--muted-foreground); text-align: center; line-height: 1.15; }
</style>
