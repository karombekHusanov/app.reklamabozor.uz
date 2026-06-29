<script setup lang="ts">
import { FileText, MessageSquareQuote } from '@lucide/vue'
import { computed, onMounted } from 'vue'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import EmptyState from '@/core/ui/EmptyState.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import { useTelegram } from '@/core/composables/useTelegram'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { categoryName } from '@/core/i18n/category-name'
import OrderStatusBadge from '@/modules/orders/components/OrderStatusBadge.vue'
import OfferCard from '@/modules/orders/components/OfferCard.vue'
import { useOrdersStore } from '@/modules/orders/stores/orders.store'

const props = defineProps<{ id: string }>()

const orders = useOrdersStore()
const locale = useLocaleStore()
const { haptic } = useTelegram()

const order = computed(() => orders.currentOrder)
const offers = computed(() => order.value?.offers ?? [])
// The client can still pick a winning offer while the order is open.
const selectable = computed(() =>
  order.value ? ['new', 'offers_sent'].includes(order.value.status) : false,
)

onMounted(() => orders.loadOrder(Number(props.id)))

async function acceptOffer(offerId: number) {
  haptic('light')
  const ok = await orders.accept(offerId)
  if (ok) haptic('medium')
}
</script>

<template>
  <div>
    <AppHeader :title="locale.t.orders.detailTitle" :subtitle="locale.t.orders.detailSubtitle" show-back />

    <section class="space-y-4 px-5">

      <template v-if="orders.isLoading && !order">
        <Skeleton class="h-40 w-full rounded-3xl" />
        <Skeleton class="h-32 w-full rounded-3xl" />
      </template>

      <template v-else-if="order">
        <!-- Summary -->
        <GlassCard class="space-y-3">
          <div class="flex items-start justify-between gap-3">
            <h2 class="text-lg font-semibold leading-tight">
              {{ order.category ? categoryName(order.category, locale.locale) : order.title }}
            </h2>
            <OrderStatusBadge :status="order.status" class="shrink-0" />
          </div>

          <p class="text-sm text-muted-foreground">
            {{ order.description }}
          </p>

          <a
            v-if="order.tz_file"
            :href="order.tz_file"
            target="_blank"
            rel="noopener"
            class="inline-flex items-center gap-2 rounded-2xl bg-secondary px-4 py-2.5 text-sm font-medium text-primary dark:bg-white/5"
          >
            <FileText class="size-4" />
            {{ locale.t.orders.viewBrief }}
          </a>
        </GlassCard>

        <!-- Offers -->
        <div class="space-y-3">
          <div class="flex items-center gap-2 px-1">
            <MessageSquareQuote class="size-4 text-white" />
            <h3 class="text-base font-semibold text-white">
              {{ locale.t.orders.offersHeading }} ({{ offers.length }})
            </h3>
          </div>

          <GlassCard v-if="offers.length === 0" padding="none" class="overflow-hidden">
            <EmptyState
              :icon="MessageSquareQuote"
              :title="locale.t.orders.noOffersTitle"
              :description="locale.t.orders.noOffersBody"
            />
          </GlassCard>

          <OfferCard
            v-for="offer in offers"
            v-else
            :key="offer.id"
            :offer="offer"
            :selectable="selectable"
            :accepting="orders.isSubmitting"
            @accept="acceptOffer(offer.id)"
          />
        </div>

        <p v-if="orders.error" class="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {{ orders.error }}
        </p>
      </template>

      <GlassCard v-else padding="none" class="overflow-hidden">
        <EmptyState
          :icon="MessageSquareQuote"
          :title="locale.t.orders.notFoundTitle"
          :description="locale.t.orders.notFoundBody"
        />
      </GlassCard>
    </section>
  </div>
</template>
