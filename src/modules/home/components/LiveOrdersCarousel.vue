<script setup lang="ts">
import { ChevronRight, Eye, MessageSquareQuote } from '@lucide/vue'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import Autoplay from 'embla-carousel-autoplay'
import { Carousel, CarouselContent, CarouselItem } from '@/core/ui/carousel'
import Avatar from '@/core/ui/Avatar.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import { categoryName } from '@/core/i18n/category-name'
import { formatDateTime } from '@/core/lib/date'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { useHomeStore } from '@/modules/home/stores/home.store'
import { ROUTES } from '@/modules/shell/constants/routes'
import type { LiveOrder } from '@/modules/home/services/live-orders.service'

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

function orderTitle(order: LiveOrder): string {
  return order.title
    || (order.category ? categoryName(order.category, locale.locale) : '')
}

function categoryLabel(order: LiveOrder): string | null {
  if (!order.category) return null
  return categoryName(order.category, locale.locale)
}

function openDetail(order: LiveOrder) {
  router.push(ROUTES.liveOrderDetail(order.id))
}

function openClient(e: Event, clientId: number) {
  e.stopPropagation()
  router.push(ROUTES.clientDetail(clientId))
}
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
      <Skeleton class="h-[9.5rem] w-full rounded-[1.35rem]" />
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
          <article
            class="live-order-card pressable h-full cursor-pointer"
            @click="openDetail(order)"
          >
            <div class="flex shrink-0 items-center gap-2">
              <span
                v-if="categoryLabel(order)"
                class="live-order-card__chip min-w-0"
              >
                {{ categoryLabel(order) }}
              </span>
              <span class="live-order-card__date">
                {{ formatDateTime(order.created_at) }}
              </span>
            </div>

            <h3 class="live-order-card__title">
              {{ orderTitle(order) }}
            </h3>

            <button
              v-if="order.client"
              type="button"
              class="flex shrink-0 items-center gap-2 text-left"
              @click.stop="openClient($event, order.client.id)"
            >
              <Avatar
                :src="order.client.avatar"
                :name="order.client.first_name ?? undefined"
                size="sm"
                class="rounded-full"
              />
              <span class="truncate text-xs font-semibold text-foreground">
                {{ order.client.first_name }}
              </span>
            </button>

            <div class="live-order-card__meta shrink-0">
              <span class="live-order-card__stat">
                <Eye class="size-3.5 shrink-0 opacity-80" />
                <span class="tabular-nums">{{ order.views_count }}</span>
                <span class="font-semibold text-muted-foreground/80">{{ locale.t.orders.viewsSuffix }}</span>
              </span>
              <span class="live-order-card__stat live-order-card__stat--offers">
                <MessageSquareQuote class="size-3.5 shrink-0" />
                <span class="tabular-nums">{{ order.offers_count }}</span>
                <span class="font-semibold opacity-90">{{ locale.t.orders.offersSuffix }}</span>
              </span>
            </div>
          </article>
        </CarouselItem>
      </CarouselContent>
    </Carousel>
  </div>
</template>
