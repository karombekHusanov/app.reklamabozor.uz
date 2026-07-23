<script setup lang="ts">
import { Eye, Inbox, MessageSquareQuote } from '@lucide/vue'
import { onMounted, ref } from 'vue'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import EmptyState from '@/core/ui/EmptyState.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import { categoryName } from '@/core/i18n/category-name'
import { formatDate } from '@/core/lib/date'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { fetchLiveOrders, type LiveOrder } from '@/modules/home/services/live-orders.service'

const locale = useLocaleStore()

const orders = ref<LiveOrder[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    orders.value = await fetchLiveOrders(20)
  }
  catch {
    orders.value = []
  }
  finally {
    loading.value = false
  }
})

function orderTitle(order: LiveOrder): string {
  if (order.category) return categoryName(order.category, locale.locale)
  return order.title
}
</script>

<template>
  <div class="pb-6">
    <AppHeader
      :title="locale.t.home.liveOrdersTitle"
      :subtitle="locale.t.home.liveOrdersSubtitle"
      show-back
    />

    <section class="space-y-3 px-5 pt-2">
      <template v-if="loading">
        <Skeleton
          v-for="n in 5"
          :key="n"
          class="h-[104px] w-full rounded-2xl"
        />
      </template>

      <GlassCard
        v-else-if="orders.length === 0"
        padding="none"
        class="overflow-hidden"
      >
        <EmptyState
          :icon="Inbox"
          :title="locale.t.home.liveOrdersEmpty"
          :description="locale.t.home.liveOrdersSubtitle"
        />
      </GlassCard>

      <template v-else>
        <article
          v-for="order in orders"
          :key="order.id"
          class="live-order-card"
        >
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
      </template>
    </section>
  </div>
</template>
