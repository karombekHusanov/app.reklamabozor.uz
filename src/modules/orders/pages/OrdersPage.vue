<script setup lang="ts">
import { ClipboardList, LogIn, Plus } from '@lucide/vue'
import { onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import EmptyState from '@/core/ui/EmptyState.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import { Button } from '@/core/ui/button'
import Badge from '@/core/ui/Badge.vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { ROUTES } from '@/modules/shell/constants/routes'
import OrderTile from '@/modules/orders/components/OrderTile.vue'
import { orderStatusVariant } from '@/modules/orders/lib/order-status'
import { useOrdersStore } from '@/modules/orders/stores/orders.store'
import type { Order } from '@/modules/orders/types/order'

const auth = useAuthStore()
const orders = useOrdersStore()
const router = useRouter()
const locale = useLocaleStore()

function load() {
  if (auth.isAuthenticated) orders.loadMyOrders(true)
}

onMounted(load)
watch(() => auth.isAuthenticated, load)

// A claimed Tezkor request sits in `offers_sent`, but for the client it means
// "an agent is on it" — not "offers to compare" (Tender wording).
function statusLabel(order: Order): string {
  if (order.route === 'tezkor' && order.claim && ['new', 'offers_sent'].includes(order.status)) {
    return locale.t.route.claimedStatus
  }
  return locale.t.orders.status[order.status]
}

function openOrder(id: number) {
  router.push(`/orders/${id}`)
}
</script>

<template>
  <div>
    <AppHeader
      :title="locale.t.orders.myOrdersTitle"
      :subtitle="locale.t.orders.myOrdersSubtitle"
      show-back
    />

    <section class="space-y-3 px-5">
      <template v-if="!auth.isAuthenticated">
        <GlassCard padding="none" class="overflow-hidden">
          <EmptyState
            :icon="LogIn"
            :title="locale.t.orders.signInTitle"
            :description="locale.t.orders.signInBody"
          >
            <Button class="mt-1 rounded-2xl" @click="router.push(ROUTES.profile)">
              {{ locale.t.orders.goToProfile }}
            </Button>
          </EmptyState>
        </GlassCard>
      </template>

      <template v-else-if="orders.isLoading && orders.myOrders.length === 0">
        <Skeleton v-for="n in 3" :key="n" class="h-[220px] w-full rounded-[1.35rem]" />
      </template>

      <template v-else-if="orders.myOrders.length === 0">
        <GlassCard padding="none" class="overflow-hidden">
          <EmptyState
            :icon="ClipboardList"
            :title="locale.t.orders.emptyTitle"
            :description="locale.t.orders.emptyBody"
          >
            <button
              type="button"
              class="rb-cta-btn mt-1 !min-h-[46px] !text-[14px]"
              @click="router.push(ROUTES.newOrder)"
            >
              <Plus class="size-[18px]" />
              {{ locale.t.orders.newRequest }}
            </button>
          </EmptyState>
        </GlassCard>
      </template>

      <!-- The persistent coral action lives in the bottom dock — no second CTA here. -->
      <template v-else>
        <OrderTile
          v-for="order in orders.myOrders"
          :key="order.id"
          :title="order.title"
          :description="order.description"
          :category="order.category"
          :region="order.region"
          :created-at="order.created_at"
          :views-count="order.views_count"
          :offers-count="order.offers_count"
          @open="openOrder(order.id)"
        >
          <template #badge>
            <Badge
              :variant="orderStatusVariant(order.status)"
              class="shrink-0 !px-2.5 !py-1 text-[11px] font-bold"
            >
              {{ statusLabel(order) }}
            </Badge>
          </template>
        </OrderTile>
      </template>
    </section>
  </div>
</template>
