<script setup lang="ts">
import { ChevronRight, Eye, MessageSquareQuote, Radio } from '@lucide/vue'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import Autoplay from 'embla-carousel-autoplay'
import { Carousel, CarouselContent, CarouselItem } from '@/core/ui/carousel'
import Skeleton from '@/core/ui/Skeleton.vue'
import { categoryName } from '@/core/i18n/category-name'
import { formatDate } from '@/core/lib/date'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { useHomeStore } from '@/modules/home/stores/home.store'
import { ROUTES } from '@/modules/shell/constants/routes'
import type { LiveOrder } from '@/modules/home/services/live-orders.service'

const locale = useLocaleStore()
const home = useHomeStore()
const router = useRouter()

const loading = computed(() => !home.hasLoaded && home.isLoading)
const orders = computed(() => home.liveOrders)

const carouselOpts = {
  loop: true,
  align: 'start' as const,
  containScroll: 'trimSnaps' as const,
}

const AUTOPLAY_MS = 3200
// One stable plugin instance (matches the banner carousel) — recreating it on
// every computed re-eval would reset autoplay.
const autoplay = Autoplay({ delay: AUTOPLAY_MS, stopOnInteraction: true })
const carouselPlugins = computed(() => (orders.value.length > 1 ? [autoplay] : []))

function orderTitle(order: LiveOrder): string {
  if (order.category) return categoryName(order.category, locale.locale)
  return order.title
}
</script>

<template>
  <div v-if="loading || orders.length">
    <div class="mb-3 flex items-center justify-between px-1">
      <div class="min-w-0">
        <h2 class="flex items-center gap-1.5 text-base font-bold text-foreground">
          <span
            class="live-orders-pulse"
            aria-hidden="true"
          >
            <Radio class="size-3.5" />
          </span>
          {{ locale.t.home.liveOrdersTitle }}
        </h2>
        <p class="mt-0.5 text-xs text-muted-foreground">
          {{ locale.t.home.liveOrdersSubtitle }}
        </p>
      </div>
      <button
        type="button"
        class="pressable inline-flex shrink-0 items-center gap-0.5 text-sm font-medium text-muted-foreground transition active:text-foreground"
        @click="router.push(ROUTES.liveOrders)"
      >
        {{ locale.t.home.viewAllAgents }}
        <ChevronRight class="size-4" />
      </button>
    </div>

    <!-- Loading -->
    <div
      v-if="loading"
      class="flex gap-3"
    >
      <Skeleton
        v-for="n in 2"
        :key="n"
        class="h-[104px] w-[80%] shrink-0 rounded-2xl"
      />
    </div>

    <!-- Carousel -->
    <Carousel
      v-else
      :opts="carouselOpts"
      :plugins="carouselPlugins"
    >
      <CarouselContent class="-ml-3">
        <CarouselItem
          v-for="order in orders"
          :key="order.id"
          class="basis-[80%] pl-3 sm:basis-[46%]"
        >
          <article class="live-order-card">
            <div class="flex items-center gap-2">
              <span class="live-order-card__chip">
                {{ orderTitle(order) }}
              </span>
            </div>

            <p class="live-order-card__desc">
              {{ order.description || orderTitle(order) }}
            </p>

            <div class="live-order-card__meta">
              <span class="live-order-card__stat">
                <Eye class="size-3.5" />
                {{ order.views_count }}
                <span class="text-muted-foreground/80">{{ locale.t.orders.viewsSuffix }}</span>
              </span>
              <span class="live-order-card__stat live-order-card__stat--offers">
                <MessageSquareQuote class="size-3.5" />
                {{ order.offers_count }}
                <span class="opacity-80">{{ locale.t.orders.offersSuffix }}</span>
              </span>
              <span class="ml-auto shrink-0 text-[10px] font-medium text-muted-foreground">
                {{ formatDate(order.created_at, locale.locale) }}
              </span>
            </div>
          </article>
        </CarouselItem>
      </CarouselContent>
    </Carousel>
  </div>
</template>
