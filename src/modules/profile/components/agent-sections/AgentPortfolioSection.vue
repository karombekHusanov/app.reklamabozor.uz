<script setup lang="ts">
import { ExternalLink } from '@lucide/vue'
import { computed } from 'vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import AgentProfileSectionShell from '@/modules/profile/components/agent-sections/AgentProfileSectionShell.vue'
import { portfolioBentoClass } from '@/modules/profile/lib/category-accent'
import type { PortfolioItem } from '@/modules/agent/types/agent'

const props = defineProps<{
  items: PortfolioItem[]
}>()

const locale = useLocaleStore()

const total = computed(() => props.items.length)

function coverImage(item: PortfolioItem): string | null {
  if (item.images.length > 0) return item.images[0].url
  return item.image
}

function extraImageCount(item: PortfolioItem): number {
  const count = item.images.length > 0 ? item.images.length : (item.image ? 1 : 0)
  return Math.max(0, count - 1)
}
</script>

<template>
  <AgentProfileSectionShell :title="locale.t.profile.agentPortfolioTitle">
    <div class="agent-portfolio-bento">
      <component
        :is="item.link_url ? 'a' : 'article'"
        v-for="(item, index) in items"
        :key="item.id"
        :href="item.link_url ?? undefined"
        :target="item.link_url ? '_blank' : undefined"
        :rel="item.link_url ? 'noopener' : undefined"
        class="agent-portfolio-bento__item"
        :class="portfolioBentoClass(index, total)"
      >
        <div
          v-if="coverImage(item)"
          class="agent-portfolio-bento__media"
        >
          <img
            :src="coverImage(item)!"
            :alt="item.title"
            class="agent-portfolio-bento__image"
            loading="lazy"
          >
          <span
            v-if="extraImageCount(item) > 0"
            class="agent-portfolio-bento__more"
          >
            {{ locale.t.profile.agentPortfolioMoreImages.replace('{n}', String(extraImageCount(item))) }}
          </span>
        </div>
        <div class="agent-portfolio-bento__overlay">
          <p class="truncate text-[11px] font-bold text-white">
            {{ item.title }}
          </p>
          <p
            v-if="item.description"
            class="mt-0.5 line-clamp-2 text-[10px] font-medium leading-snug text-white/90"
          >
            {{ item.description }}
          </p>
          <span
            v-if="item.link_url"
            class="mt-1 inline-flex items-center gap-0.5 text-[10px] font-medium text-white/90"
          >
            <ExternalLink class="size-3" />
            {{ locale.t.profile.agentPortfolioOpenLink }}
          </span>
        </div>
      </component>
    </div>
  </AgentProfileSectionShell>
</template>
