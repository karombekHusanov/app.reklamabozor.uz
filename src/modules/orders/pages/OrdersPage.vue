<script setup lang="ts">
import { ClipboardList, LogIn, Plus } from '@lucide/vue'
import { onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import EmptyState from '@/core/ui/EmptyState.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import { Button } from '@/core/ui/button'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { ROUTES } from '@/modules/shell/constants/routes'
import OrderCard from '@/modules/orders/components/OrderCard.vue'
import { useOrdersStore } from '@/modules/orders/stores/orders.store'

const auth = useAuthStore()
const orders = useOrdersStore()
const router = useRouter()
const locale = useLocaleStore()

function load() {
  if (auth.isAuthenticated) orders.loadMyOrders(true)
}

onMounted(load)
watch(() => auth.isAuthenticated, load)

function openOrder(id: number) {
  router.push(`/orders/${id}`)
}
</script>

<template>
  <div>
    <AppHeader :title="locale.t.orders.myOrdersTitle" :subtitle="locale.t.orders.myOrdersSubtitle" />

    <section class="space-y-4 px-5">
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
        <Skeleton v-for="n in 3" :key="n" class="h-28 w-full rounded-3xl" />
      </template>

      <template v-else-if="orders.myOrders.length === 0">
        <GlassCard padding="none" class="overflow-hidden">
          <EmptyState
            :icon="ClipboardList"
            :title="locale.t.orders.emptyTitle"
            :description="locale.t.orders.emptyBody"
          >
            <Button class="mt-1 rounded-2xl" @click="router.push(ROUTES.newOrder)">
              <Plus class="size-4" />
              {{ locale.t.orders.newRequest }}
            </Button>
          </EmptyState>
        </GlassCard>
      </template>

      <template v-else>
        <Button class="h-11 w-full rounded-2xl" @click="router.push(ROUTES.newOrder)">
          <Plus class="size-4" />
          {{ locale.t.orders.newRequest }}
        </Button>
        <OrderCard
          v-for="order in orders.myOrders"
          :key="order.id"
          :order="order"
          @open="openOrder(order.id)"
        />
      </template>
    </section>
  </div>
</template>
