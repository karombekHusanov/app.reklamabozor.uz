<script setup lang="ts">
import { ArrowUpRight } from '@lucide/vue'
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { ROUTES } from '@/modules/shell/constants/routes'
import AgentProfileSectionShell from '@/modules/profile/components/agent-sections/AgentProfileSectionShell.vue'
import { portfolioBentoClass } from '@/modules/profile/lib/category-accent'
import type { PortfolioItem } from '@/modules/agent/types/agent'

const props = defineProps<{
  agentId: number | string
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
      <RouterLink
        v-for="(item, index) in items"
        :key="item.id"
        :to="ROUTES.agentPortfolio(agentId, item.id)"
        class="agent-portfolio-bento__item pressable"
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
        </div>
        <span
          class="agent-portfolio-bento__open"
          aria-hidden="true"
        >
          <ArrowUpRight class="size-3.5" />
        </span>
      </RouterLink>
    </div>
  </AgentProfileSectionShell>
</template>
