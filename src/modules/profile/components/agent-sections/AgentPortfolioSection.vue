<script setup lang="ts">
import { Eye, Star } from '@lucide/vue'
import { computed } from 'vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import AgentProfileSectionShell from '@/modules/profile/components/agent-sections/AgentProfileSectionShell.vue'
import { portfolioBentoClass } from '@/modules/profile/lib/category-accent'

const locale = useLocaleStore()

// TODO(backend): replace with agent portfolio items from API.
const items = [
  {
    id: 1,
    rating: '4.9',
    views: 128,
    image: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=640&h=480&q=80',
    alt: 'Billboard mockup',
    label: 'Billboard',
  },
  {
    id: 2,
    rating: '4.8',
    views: 96,
    image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=480&h=640&q=80',
    alt: 'Print design',
    label: 'Poligrafiya',
  },
  {
    id: 3,
    rating: '5.0',
    views: 214,
    image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=480&h=480&q=80',
    alt: 'Branding mockup',
    label: 'Brending',
  },
  {
    id: 4,
    rating: '4.7',
    views: 87,
    image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=640&h=360&q=80',
    alt: 'Outdoor advertising',
    label: 'Tashqi reklama',
  },
  {
    id: 5,
    rating: '4.9',
    views: 64,
    image: 'https://images.unsplash.com/photo-1611162617474-5b21e939e988?auto=format&fit=crop&w=480&h=480&q=80',
    alt: 'Business cards',
    label: 'Vizitka',
  },
  {
    id: 6,
    rating: '4.8',
    views: 53,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&w=480&h=640&q=80',
    alt: 'Roll-up banner',
    label: 'Roll-up',
  },
] as const

const total = computed(() => items.length)
</script>

<template>
  <AgentProfileSectionShell
    :title="locale.t.profile.agentPortfolioTitle"
    show-view-all
  >
    <div class="agent-portfolio-bento">
      <article
        v-for="(item, index) in items"
        :key="item.id"
        class="agent-portfolio-bento__item"
        :class="portfolioBentoClass(index, total)"
      >
        <img
          :src="item.image"
          :alt="item.alt"
          class="agent-portfolio-bento__image"
          loading="lazy"
        >
        <div class="agent-portfolio-bento__overlay">
          <p class="truncate text-[11px] font-bold text-white">
            {{ item.label }}
          </p>
          <div class="mt-1 flex items-center gap-2 text-[10px] font-medium text-white/90">
            <span class="inline-flex items-center gap-0.5">
              <Star class="size-3 fill-amber-300 text-amber-300" />
              {{ item.rating }}
            </span>
            <span class="inline-flex items-center gap-0.5">
              <Eye class="size-3" />
              {{ item.views }}
            </span>
          </div>
        </div>
      </article>
    </div>
  </AgentProfileSectionShell>
</template>
