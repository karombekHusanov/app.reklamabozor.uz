<script setup lang="ts">
import { ArrowRight } from '@lucide/vue'
import { computed } from 'vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { categoryName } from '@/core/i18n/category-name'
import { categoryIcon } from '@/modules/orders/lib/category-icon'
import type { Category } from '@/modules/agent/types/agent'

/**
 * "What do you need?" — the top services as a 3×2 grid, everything visible at
 * once (no sideways scroll). The sixth tile opens the full catalogue with its
 * count. Icons are matched to the service name; uploaded category images are
 * ignored here so the grid stays one visual language.
 */
const props = defineProps<{
  categories: Category[]
}>()

const emit = defineEmits<{
  select: [category: Category]
  viewAll: []
}>()

const locale = useLocaleStore()

const TOP = 5

/** Named services first ("Boshqa" catch-alls only live in the full list). */
const top = computed(() => props.categories.filter(c => !c.is_other).slice(0, TOP))
</script>

<template>
  <section
    v-if="categories.length"
    class="svc"
    :aria-label="locale.t.home.browseByService"
  >
    <span class="rb-eyebrow">{{ locale.t.landing.servicesEyebrow }}</span>
    <h2 class="rb-sec__title svc__title">
      {{ locale.t.home.browseByService }}
    </h2>

    <div class="svc__grid">
      <button
        v-for="(cat, i) in top"
        :key="cat.id"
        type="button"
        class="svc-tile rb-stagger"
        :style="{ '--i': i }"
        @click="emit('select', cat)"
      >
        <span
          class="svc-tile__ic"
          aria-hidden="true"
        >
          <component
            :is="categoryIcon(cat)"
            class="size-[21px]"
          />
        </span>
        <span class="svc-tile__name">{{ categoryName(cat, locale.locale) }}</span>
      </button>

      <button
        type="button"
        class="svc-tile svc-tile--all rb-stagger"
        :style="{ '--i': TOP }"
        @click="emit('viewAll')"
      >
        <span
          class="svc-tile__ic"
          aria-hidden="true"
        >
          <ArrowRight class="size-[21px]" />
        </span>
        <span class="svc-tile__name">{{ locale.t.landing.servicesAll }}</span>
        <span class="svc-tile__count">{{ locale.t.landing.servicesAllCount.replace('{count}', String(categories.length)) }}</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.svc__title { margin: 3px 0 13px; }

.svc__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }

.svc-tile {
  display: flex; flex-direction: column; align-items: flex-start; gap: 10px; min-width: 0; min-height: 104px; padding: 12px;
  background: var(--card); border: 1px solid var(--border); border-radius: var(--rb-r-tile); box-shadow: var(--rb-elev-1);
  font-family: inherit; text-align: left; cursor: pointer;
  transition: transform var(--rb-dur) var(--rb-ease), border-color var(--rb-dur) var(--rb-ease);
  -webkit-tap-highlight-color: transparent;
}
.svc-tile:active { transform: scale(0.96); border-color: var(--primary); }
.svc-tile:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }

.svc-tile__ic {
  display: grid; place-items: center; width: 42px; height: 42px; border-radius: 13px;
  background: var(--secondary); color: var(--primary);
}
.svc-tile__name {
  font-size: 12.5px; font-weight: 700; line-height: 1.2; color: var(--foreground);
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}

/* The catalogue tile — solid brand so "see everything" reads as the way on. */
.svc-tile--all { border-color: transparent; background: linear-gradient(150deg, var(--primary) 0%, var(--brand-600) 100%); }
.svc-tile--all .svc-tile__ic { background: rgba(255, 255, 255, 0.16); color: #fff; }
.svc-tile--all .svc-tile__name { color: #fff; }
.svc-tile__count { margin-top: -6px; font-size: 11px; font-weight: 600; color: rgba(255, 255, 255, 0.78); }
</style>
