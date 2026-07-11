<script setup lang="ts">
import { Star } from '@lucide/vue'
import Avatar from '@/core/ui/Avatar.vue'
import { Carousel, CarouselContent, CarouselItem } from '@/core/ui/carousel'
import { useLocaleStore } from '@/core/i18n/locale.store'
import type { PublicReview } from '@/modules/marketplace/services/agents.service'
import AgentProfileSectionShell from '@/modules/profile/components/agent-sections/AgentProfileSectionShell.vue'

defineProps<{
  reviews: PublicReview[]
}>()

const locale = useLocaleStore()
</script>

<template>
  <AgentProfileSectionShell :title="locale.t.profile.agentTestimonialsTitle">
    <Carousel
      class="agent-profile-carousel"
      :opts="{ align: 'start', dragFree: true, containScroll: 'trimSnaps' }"
    >
      <CarouselContent class="-ml-2.5 pl-2 pr-2">
        <CarouselItem
          v-for="review in reviews"
          :key="review.id"
          class="w-[11.5rem] shrink-0 grow-0 basis-[11.5rem] pl-2.5"
        >
          <article class="agent-profile-testimonial h-full p-2.5 text-left">
            <div class="flex items-center gap-2">
              <Avatar
                :src="review.client_avatar"
                :name="review.client_name"
                size="sm"
                class="!size-8 !text-[10px]"
              />
              <div class="min-w-0">
                <p class="truncate text-[11px] font-bold text-foreground">
                  {{ review.client_name }}
                </p>
              </div>
            </div>

            <div class="mt-2 flex items-center">
              <Star
                v-for="n in 5"
                :key="n"
                class="size-3"
                :class="n <= review.rating ? 'fill-amber-400 text-amber-400' : 'fill-muted/30 text-muted/30'"
              />
            </div>

            <p
              v-if="review.comment"
              class="mt-2 line-clamp-4 text-[10px] leading-snug text-muted-foreground"
            >
              {{ review.comment }}
            </p>
          </article>
        </CarouselItem>
      </CarouselContent>
    </Carousel>
  </AgentProfileSectionShell>
</template>
