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
import { ROUTES } from '@/modules/shell/constants/routes'
import OrderCard from '@/modules/orders/components/OrderCard.vue'
import { useOrdersStore } from '@/modules/orders/stores/orders.store'

const auth = useAuthStore()
const orders = useOrdersStore()
const router = useRouter()

function load() {
  if (auth.isAuthenticated) orders.loadMyOrders()
}

onMounted(load)
watch(() => auth.isAuthenticated, load)

function openOrder(id: number) {
  router.push(`/orders/${id}`)
}
</script>

<template>
  <div>
    <AppHeader title="My Orders" subtitle="Your campaign requests" />

    <section class="space-y-4 px-5">
      <template v-if="!auth.isAuthenticated">
        <GlassCard padding="none" class="overflow-hidden">
          <EmptyState
            :icon="LogIn"
            title="Sign in to see your orders"
            description="Your orders are tied to your account."
          >
            <Button class="mt-1 rounded-2xl" @click="router.push(ROUTES.profile)">
              Go to Profile
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
            title="No orders yet"
            description="Place a request and agencies will send you offers."
          >
            <Button class="mt-1 rounded-2xl" @click="router.push(ROUTES.newOrder)">
              <Plus class="size-4" />
              New request
            </Button>
          </EmptyState>
        </GlassCard>
      </template>

      <template v-else>
        <Button class="h-11 w-full rounded-2xl" @click="router.push(ROUTES.newOrder)">
          <Plus class="size-4" />
          New request
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
