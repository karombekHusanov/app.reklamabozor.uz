<script setup lang="ts">
import { ChevronRight } from '@lucide/vue'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import Autoplay from 'embla-carousel-autoplay'
import { Carousel, CarouselContent, CarouselItem } from '@/core/ui/carousel'
import Skeleton from '@/core/ui/Skeleton.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { useHomeStore } from '@/modules/home/stores/home.store'
import { ROUTES } from '@/modules/shell/constants/routes'
import LiveOrderCard from '@/modules/home/components/LiveOrderCard.vue'

const locale = useLocaleStore()
const home = useHomeStore()
const router = useRouter()

const loading = computed(() => !home.hasLoaded && home.isLoading)
const orders = computed(() => home.liveOrders)

/** One full-width card at a time; loop so autoplay keeps advancing. */
const carouselOpts = {
  loop: true,
  align: 'start' as const,
  duration: 25,
}

const AUTOPLAY_MS = 3200
const autoplay = Autoplay({
  delay: AUTOPLAY_MS,
  stopOnInteraction: false,
  stopOnMouseEnter: true,
})
const carouselPlugins = computed(() => (orders.value.length > 1 ? [autoplay] : []))
</script>

<template>
  <div v-if="loading || orders.length">
    <div class="app-section__header">
      <template v-if="loading">
        <Skeleton class="h-5 w-36 rounded-md" />
        <Skeleton class="h-4 w-20 rounded-md" />
      </template>
      <template v-else>
        <h2 class="app-section__title">
          {{ locale.t.home.liveOrdersTitle }}
        </h2>
        <button
          type="button"
          class="app-section__link pressable"
          @click="router.push(ROUTES.liveOrders)"
        >
          {{ locale.t.home.viewAllAgents }}
          <ChevronRight class="size-3.5" />
        </button>
      </template>
    </div>

    <!-- Loading -->
    <div
      v-if="loading"
      class="flex"
    >
      <Skeleton class="h-[228px] w-full rounded-[1.25rem]" />
    </div>

    <!-- Carousel -->
    <Carousel
      v-else
      class="overflow-hidden"
      :opts="carouselOpts"
      :plugins="carouselPlugins"
    >
      <CarouselContent class="-ml-[4px] items-stretch">
        <CarouselItem
          v-for="order in orders"
          :key="order.id"
          class="basis-full pl-[4px]"
        >
          <LiveOrderCard
            :order="order"
            class="h-full"
          />
        </CarouselItem>
      </CarouselContent>
    </Carousel>
  </div>
</template>
