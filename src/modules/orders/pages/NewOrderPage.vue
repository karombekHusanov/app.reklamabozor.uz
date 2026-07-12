<script setup lang="ts">
import { CircleCheck, LogIn } from '@lucide/vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import { Button } from '@/core/ui/button'
import { useTelegram } from '@/core/composables/useTelegram'
import { useToast } from '@/core/composables/useToast'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { ROUTES } from '@/modules/shell/constants/routes'
import OrderWizard from '@/modules/orders/components/OrderWizard.vue'
import { fetchCategories } from '@/modules/orders/services/orders.service'
import { useOrdersStore } from '@/modules/orders/stores/orders.store'
import { fetchPublicAgent } from '@/modules/marketplace/services/agents.service'
import type { Category } from '@/modules/agent/types/agent'
import type { CreateOrderPayload, Order } from '@/modules/orders/types/order'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const orders = useOrdersStore()
const locale = useLocaleStore()
const toast = useToast()
const { haptic } = useTelegram()

const serviceType = computed(() => {
  const type = route.query.type
  return type === 'designer' || type === 'agent' ? type : undefined
})

// Directed order: `?agent={profileId}` — the order reaches only this agency,
// and the Service step is limited to the categories it serves.
const targetAgentId = computed(() => {
  const id = Number(route.query.agent)
  return Number.isInteger(id) && id > 0 ? id : null
})

const categories = ref<Category[]>([])
const targetAgent = ref<{ id: number, company_name: string } | null>(null)
const loadingCategories = ref(false)
const submitted = ref(false)
const createdOrder = ref<Order | null>(null)

const headerSubtitle = computed(() => {
  if (targetAgent.value) return targetAgent.value.company_name
  return serviceType.value === 'designer' ? locale.t.orders.findDesigner : locale.t.orders.findAgency
})

async function loadCategories() {
  if (!auth.isAuthenticated) return
  loadingCategories.value = true
  try {
    if (targetAgentId.value !== null) {
      // Directed order — use the agency's own categories and remember its name.
      const agent = await fetchPublicAgent(targetAgentId.value)
      targetAgent.value = { id: agent.id, company_name: agent.display_name }
      categories.value = agent.categories
    }
    else {
      targetAgent.value = null
      categories.value = await fetchCategories(serviceType.value)
    }
  }
  finally {
    loadingCategories.value = false
  }
}

onMounted(loadCategories)
watch([() => auth.isAuthenticated, serviceType, targetAgentId], loadCategories)

async function handleSubmit(payload: CreateOrderPayload) {
  haptic('light')
  const order = await orders.create(payload)

  if (order) {
    haptic('medium')
    createdOrder.value = order
    submitted.value = true
    // Let the success screen breathe, then send the user to their orders.
    setTimeout(() => router.replace(ROUTES.orders), 2400)
  }
  else if (orders.error) {
    // Surface the failure as a toast — the inline message is easy to miss.
    haptic('heavy')
    toast.error(orders.error)
  }
}
</script>

<template>
  <div>
    <AppHeader
      :title="locale.t.orders.quickOrderTitle"
      :subtitle="headerSubtitle"
      show-back
    />

    <section class="space-y-5 px-5">
      <!-- Success -->
      <GlassCard
        v-if="submitted"
        class="space-y-3 text-center"
      >
        <div class="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
          <CircleCheck class="size-8" />
        </div>
        <h2 class="text-xl font-semibold">
          {{ locale.t.orders.successTitle }}
        </h2>
        <p
          v-if="createdOrder"
          class="text-base font-semibold text-primary"
        >
          #{{ createdOrder.id }}
        </p>
        <p class="text-sm leading-relaxed text-muted-foreground">
          {{ locale.t.orders.successBody }}
        </p>
        <Button
          class="h-11 w-full rounded-2xl"
          @click="router.replace(ROUTES.orders)"
        >
          {{ locale.t.orders.viewMyOrders }}
        </Button>
      </GlassCard>

      <!-- Guest -->
      <GlassCard
        v-else-if="!auth.isAuthenticated"
        class="space-y-4 text-center"
      >
        <div class="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <LogIn class="size-6" />
        </div>
        <h2 class="text-lg font-semibold">
          {{ locale.t.orders.signInPlaceTitle }}
        </h2>
        <p class="text-sm text-muted-foreground">
          {{ locale.t.orders.signInPlaceBody }}
        </p>
        <Button
          class="h-11 w-full rounded-2xl"
          @click="router.push(ROUTES.profile)"
        >
          {{ locale.t.orders.goToProfile }}
        </Button>
      </GlassCard>

      <!-- Loading categories -->
      <template v-else-if="loadingCategories && categories.length === 0">
        <Skeleton class="h-40 w-full rounded-3xl" />
        <Skeleton class="h-56 w-full rounded-3xl" />
      </template>

      <!-- Wizard (errors surface via toast in handleSubmit) -->
      <template v-else>
        <OrderWizard
          :categories="categories"
          :submitting="orders.isSubmitting"
          :target-agent="targetAgent"
          @submit="handleSubmit"
        />
      </template>
    </section>
  </div>
</template>
