<script setup lang="ts">
import { Eye, Star } from '@lucide/vue'
import { Carousel, CarouselContent, CarouselItem } from '@/core/ui/carousel'
import { useLocaleStore } from '@/core/i18n/locale.store'
import AgentProfileSectionShell from '@/modules/profile/components/agent-sections/AgentProfileSectionShell.vue'

const locale = useLocaleStore()

const items = [
  {
    id: 1,
    rating: '4.9',
    views: 128,
    image: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=320&h=400&q=80',
    alt: 'Billboard mockup',
  },
  {
    id: 2,
    rating: '4.8',
    views: 96,
    image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=320&h=400&q=80',
    alt: 'Print design',
  },
  {
    id: 3,
    rating: '5.0',
    views: 214,
    image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=320&h=400&q=80',
    alt: 'Branding mockup',
  },
  {
    id: 4,
    rating: '4.7',
    views: 87,
    image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=320&h=400&q=80',
    alt: 'Outdoor advertising',
  },
  {
    id: 5,
    rating: '4.9',
    views: 64,
    image: 'https://images.unsplash.com/photo-1611162617474-5b21e939e988?auto=format&fit=crop&w=320&h=400&q=80',
    alt: 'Business cards',
  },
  {
    id: 6,
    rating: '4.8',
    views: 53,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&w=320&h=400&q=80',
    alt: 'Roll-up banner',
  },
] as const
</script>

<template>
  <AgentProfileSectionShell
    :title="locale.t.profile.agentPortfolioTitle"
    show-view-all
  >
    <Carousel
      class="agent-profile-carousel"
      :opts="{ align: 'start', dragFree: true, containScroll: 'trimSnaps' }"
    >
      <CarouselContent class="-ml-2.5 pl-2 pr-2">
        <CarouselItem
          v-for="item in items"
          :key="item.id"
          class="w-[7.25rem] shrink-0 grow-0 basis-[7.25rem] pl-2.5"
        >
          <article class="agent-profile-portfolio-card overflow-hidden">
            <img
              :src="item.image"
              :alt="item.alt"
              class="aspect-[4/5] w-full object-cover"
              loading="lazy"
            >
            <div class="flex items-center justify-between px-2 py-1.5">
              <span class="inline-flex items-center gap-0.5 text-[10px] font-semibold text-foreground">
                <Star class="size-3 fill-amber-400 text-amber-400" />
                {{ item.rating }}
              </span>
              <span class="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                <Eye class="size-3" />
                {{ item.views }}
              </span>
            </div>
          </article>
        </CarouselItem>
      </CarouselContent>
    </Carousel>
  </AgentProfileSectionShell>
</template>
