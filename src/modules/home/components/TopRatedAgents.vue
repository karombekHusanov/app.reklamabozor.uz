<script setup lang="ts">
import Autoplay from 'embla-carousel-autoplay'
import { ChevronRight, Crown, Star } from '@lucide/vue'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Avatar from '@/core/ui/Avatar.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import HomeAgentCardSkeleton from '@/modules/home/components/HomeAgentCardSkeleton.vue'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/core/ui/carousel'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { ROUTES } from '@/modules/shell/constants/routes'
import { fetchTopAgents, type PublicAgent } from '@/modules/marketplace/services/agents.service'

const locale = useLocaleStore()
const router = useRouter()

const agents = ref<PublicAgent[]>([])
const loading = ref(true)

const RATING = '4.7'

const autoplay = Autoplay({ delay: 4000, stopOnInteraction: true })

onMounted(async () => {
  try {
    agents.value = await fetchTopAgents(10)
  }
  finally {
    loading.value = false
  }
})

function openAgent(id: number) {
  router.push(`/agents/${id}`)
}
</script>

<template>
  <div v-if="loading || agents.length" class="space-y-3">
    <div class="flex items-center justify-between">
      <template v-if="loading">
        <Skeleton class="h-6 w-36 rounded-lg bg-white/20" />
        <Skeleton class="h-4 w-24 rounded-md bg-white/15" />
      </template>
      <template v-else>
        <h2 class="text-lg font-bold text-white">
          {{ locale.t.home.topAgencies }}
        </h2>
        <button
          type="button"
          class="inline-flex items-center gap-0.5 text-sm text-white/70 transition active:text-white"
          @click="router.push(ROUTES.marketplace)"
        >
          {{ locale.t.home.viewAllAgents }}
          <ChevronRight class="size-4" />
        </button>
      </template>
    </div>

    <div v-if="loading" class="flex gap-3 overflow-hidden">
      <HomeAgentCardSkeleton class="w-[85%] shrink-0 sm:w-[72%]" />
      <HomeAgentCardSkeleton class="w-[85%] shrink-0 opacity-70 sm:w-[72%]" />
    </div>

    <Carousel
      v-else
      class="w-full"
      :opts="{ align: 'start', loop: agents.length > 1, dragFree: true }"
      :plugins="[autoplay]"
    >
      <CarouselContent class="-ml-3">
        <CarouselItem
          v-for="(agent, index) in agents"
          :key="agent.id"
          class="basis-[85%] pl-3 sm:basis-[72%]"
        >
          <button
            type="button"
            class="w-full rounded-2xl border border-white/30 bg-white p-4 text-left shadow-md transition active:scale-[0.98]"
            :class="index === 0 && 'ring-2 ring-amber-400/40'"
            @click="openAgent(agent.id)"
          >
            <div class="flex items-start gap-3">
              <div class="relative shrink-0">
                <Avatar :src="agent.company_logo" :name="agent.company_name" size="lg" class="rounded-2xl" />
                <span
                  class="absolute -bottom-1.5 -right-1.5 flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-[11px] font-bold text-amber-950 ring-2 ring-white"
                >
                  <Crown v-if="index === 0" class="size-3.5" />
                  <template v-else>{{ index + 1 }}</template>
                </span>
              </div>
              <div class="min-w-0 flex-1">
                <p class="truncate text-base font-bold leading-tight text-[#0b1f33]">
                  {{ agent.company_name }}
                </p>
                <p v-if="agent.location_label" class="mt-0.5 truncate text-xs text-[#5b6b7e]">
                  {{ agent.location_label }}
                </p>
                <span class="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-400/90 px-2.5 py-1 text-xs font-bold text-amber-950">
                  <Star class="size-3 fill-amber-950" />
                  {{ RATING }}
                </span>
              </div>
            </div>
          </button>
        </CarouselItem>
      </CarouselContent>
    </Carousel>
  </div>
</template>
