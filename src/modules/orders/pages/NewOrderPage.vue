<script setup lang="ts">
import { CircleCheck, LogIn } from '@lucide/vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import { Button } from '@/core/ui/button'
import { useTelegram } from '@/core/composables/useTelegram'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { ROUTES } from '@/modules/shell/constants/routes'
import OrderForm from '@/modules/orders/components/OrderForm.vue'
import { fetchCategories } from '@/modules/orders/services/orders.service'
import { useOrdersStore } from '@/modules/orders/stores/orders.store'
import type { Category } from '@/modules/agent/types/agent'
import type { CreateOrderPayload } from '@/modules/orders/types/order'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const orders = useOrdersStore()
const { haptic } = useTelegram()

const serviceType = computed(() => {
  const type = route.query.type
  return type === 'designer' || type === 'agent' ? type : undefined
})

const categories = ref<Category[]>([])
const loadingCategories = ref(false)
const submitted = ref(false)

const headerSubtitle = computed(() =>
  serviceType.value === 'designer' ? 'Find a designer' : 'Find an agency',
)

async function loadCategories() {
  if (!auth.isAuthenticated) return
  loadingCategories.value = true
  try {
    categories.value = await fetchCategories(serviceType.value)
  }
  finally {
    loadingCategories.value = false
  }
}

onMounted(loadCategories)
watch([() => auth.isAuthenticated, serviceType], loadCategories)

async function handleSubmit(payload: CreateOrderPayload) {
  haptic('light')
  const order = await orders.create(payload)

  if (order) {
    haptic('medium')
    submitted.value = true
    // Let the success screen breathe, then send the user to their orders.
    setTimeout(() => router.replace(ROUTES.orders), 1800)
  }
}
</script>

<template>
  <div>
    <AppHeader title="New request" :subtitle="headerSubtitle" />

    <section class="space-y-5 px-5">
      <!-- Success -->
      <GlassCard v-if="submitted" class="space-y-3 text-center">
        <div class="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
          <CircleCheck class="size-8" />
        </div>
        <h2 class="text-xl font-semibold">
          Request sent!
        </h2>
        <p class="text-sm leading-relaxed text-muted-foreground">
          Your request was submitted successfully. Our specialists will review it and contact you with offers.
        </p>
        <Button class="h-11 w-full rounded-2xl" @click="router.replace(ROUTES.orders)">
          View my orders
        </Button>
      </GlassCard>

      <!-- Guest -->
      <GlassCard v-else-if="!auth.isAuthenticated" class="space-y-4 text-center">
        <div class="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <LogIn class="size-6" />
        </div>
        <h2 class="text-lg font-semibold">
          Sign in to place a request
        </h2>
        <p class="text-sm text-muted-foreground">
          Your requests are tied to your account so agencies can reach you.
        </p>
        <Button class="h-11 w-full rounded-2xl" @click="router.push(ROUTES.profile)">
          Go to Profile
        </Button>
      </GlassCard>

      <!-- Loading categories -->
      <template v-else-if="loadingCategories && categories.length === 0">
        <Skeleton class="h-40 w-full rounded-3xl" />
        <Skeleton class="h-56 w-full rounded-3xl" />
      </template>

      <!-- Form -->
      <template v-else>
        <OrderForm :categories="categories" :submitting="orders.isSubmitting" @submit="handleSubmit" />
        <p v-if="orders.error" class="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {{ orders.error }}
        </p>
      </template>
    </section>
  </div>
</template>
