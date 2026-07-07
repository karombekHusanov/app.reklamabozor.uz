<script setup lang="ts">
import { Star } from '@lucide/vue'
import Avatar from '@/core/ui/Avatar.vue'
import { Carousel, CarouselContent, CarouselItem } from '@/core/ui/carousel'
import { useLocaleStore } from '@/core/i18n/locale.store'
import AgentProfileSectionShell from '@/modules/profile/components/agent-sections/AgentProfileSectionShell.vue'

const locale = useLocaleStore()

const items = [
  {
    id: 1,
    nameKey: 'agentTestimonial1Name',
    roleKey: 'agentTestimonial1Role',
    quoteKey: 'agentTestimonial1Quote',
  },
  {
    id: 2,
    nameKey: 'agentTestimonial2Name',
    roleKey: 'agentTestimonial2Role',
    quoteKey: 'agentTestimonial2Quote',
  },
  {
    id: 3,
    nameKey: 'agentTestimonial3Name',
    roleKey: 'agentTestimonial3Role',
    quoteKey: 'agentTestimonial3Quote',
  },
] as const
</script>

<template>
  <AgentProfileSectionShell
    :title="locale.t.profile.agentTestimonialsTitle"
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
          class="w-[11.5rem] shrink-0 grow-0 basis-[11.5rem] pl-2.5"
        >
          <article class="agent-profile-testimonial h-full p-2.5 text-left">
            <div class="flex items-center gap-2">
              <Avatar
                :name="locale.t.profile[item.nameKey]"
                size="sm"
                class="!size-8 bg-gradient-to-br text-[10px]"
                :class="{
                  'from-sky-100 to-blue-200': item.id === 1,
                  'from-rose-100 to-orange-200': item.id === 2,
                  'from-emerald-100 to-teal-200': item.id === 3,
                }"
              />
              <div class="min-w-0">
                <p class="truncate text-[11px] font-bold text-foreground">
                  {{ locale.t.profile[item.nameKey] }}
                </p>
                <p class="truncate text-[9px] text-muted-foreground">
                  {{ locale.t.profile[item.roleKey] }}
                </p>
              </div>
            </div>

            <div class="mt-2 flex items-center">
              <Star
                v-for="n in 5"
                :key="n"
                class="size-3 fill-amber-400 text-amber-400"
              />
            </div>

            <p class="mt-2 line-clamp-4 text-[10px] leading-snug text-muted-foreground">
              {{ locale.t.profile[item.quoteKey] }}
            </p>
          </article>
        </CarouselItem>
      </CarouselContent>
    </Carousel>
  </AgentProfileSectionShell>
</template>
