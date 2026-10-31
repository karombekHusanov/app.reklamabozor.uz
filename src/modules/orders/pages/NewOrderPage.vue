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
import OrderForm from '@/modules/orders/components/OrderForm.vue'
import OrderRouteTabs from '@/modules/orders/components/OrderRouteTabs.vue'
import { fetchCategories } from '@/modules/orders/services/orders.service'
import { fetchRegions } from '@/modules/orders/services/regions.service'
import { useOrdersStore } from '@/modules/orders/stores/orders.store'
import { useOrderRouteStore } from '@/modules/orders/stores/order-route.store'
import { fetchPublicAgent } from '@/modules/marketplace/services/agents.service'
import { PLACEMENT_ORDERING_ENABLED } from '@/modules/placements/lib/feature'
import { fetchPlacement } from '@/modules/placements/services/placements.service'
import { usePlacementSelectionStore } from '@/modules/placements/stores/placement-selection.store'
import type { Category } from '@/modules/agent/types/agent'
import type { CreateOrderPayload, Order, OrderRoute } from '@/modules/orders/types/order'
import type { Region } from '@/modules/orders/types/region'
import type { Placement } from '@/modules/placements/types/placement'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const orders = useOrdersStore()
const locale = useLocaleStore()
const { haptic } = useTelegram()
const toast = useToast()
const routeStore = useOrderRouteStore()
const selection = usePlacementSelectionStore()

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

// Map order: `?placements=1,2,3` — the screens picked on the map, in order.
// The basket store already holds them; anything missing (deep link, cleared
// storage) is fetched by id. Bookable screens only — the API 404s the rest.
const placementIds = computed(() => {
  if (!PLACEMENT_ORDERING_ENABLED) return []
  const raw = String(route.query.placements ?? '')
  return [...new Set(raw.split(',').map(Number).filter(id => Number.isInteger(id) && id > 0))]
})

const categories = ref<Category[]>([])
const regions = ref<Region[]>([])
const placements = ref<Placement[]>([])
const targetAgent = ref<{ id: number, company_name: string } | null>(null)
const loadingCategories = ref(false)
const submitted = ref(false)
const createdOrder = ref<Order | null>(null)

// Subtitle: the agency a directed order goes to, or the number of picked screens.
const headerSubtitle = computed(() =>
  placements.value.length
    ? locale.t.placements.newOrderSubtitle.replace('{n}', String(placements.value.length))
    : targetAgent.value?.company_name,
)

async function loadPlacements(): Promise<Placement[]> {
  const ids = placementIds.value
  if (!ids.length) return []
  selection.keep(ids)
  const known = new Map(selection.items.map(p => [p.id, p] as const))
  const fetched = await Promise.all(ids.map(async (id) => {
    const hit = known.get(id)
    if (hit) return hit
    try {
      const detail = await fetchPlacement(id)
      selection.add(detail)
      return detail as Placement
    }
    catch {
      return null
    }
  }))
  const list = fetched.filter((p): p is Placement => p !== null)
  if (list.length < ids.length) toast.error(locale.t.placements.notFound)
  return list
}

async function loadCatalog() {
  if (!auth.isAuthenticated) return
  loadingCategories.value = true
  try {
    const regionsPromise = fetchRegions().catch(() => [] as Region[])

    if (placementIds.value.length) {
      const [list, cats, regs] = await Promise.all([loadPlacements(), fetchCategories(), regionsPromise])
      placements.value = list
      targetAgent.value = null
      categories.value = cats
      regions.value = regs
    }
    else if (targetAgentId.value !== null) {
      // Directed order — prefer the agency's categories; fall back to the full
      // catalog when the profile has none configured yet.
      const agent = await fetchPublicAgent(targetAgentId.value)
      targetAgent.value = { id: agent.id, company_name: agent.display_name }
      const [cats, regs] = await Promise.all([
        agent.categories.length > 0
          ? Promise.resolve(agent.categories)
          : fetchCategories(),
        regionsPromise,
      ])
      categories.value = cats
      regions.value = regs
    }
    else {
      targetAgent.value = null
      const [cats, regs] = await Promise.all([
        fetchCategories(serviceType.value),
        regionsPromise,
      ])
      categories.value = cats
      regions.value = regs
    }
  }
  finally {
    loadingCategories.value = false
  }
}

/**
 * Tender | Tezkor. Accounts without Tender access never see the switch — their
 * request is always Tezkor. With access the switch appears on the first step and
 * Tender is the default (until the user picks otherwise).
 */
const tenderAccessible = computed(() => routeStore.canCreateTender)
// Map orders are always Tender (priced offers from the screen owners) — no gate.
const isPlacementOrder = computed(() => placements.value.length > 0)
const activeRoute = computed<OrderRoute>(() =>
  isPlacementOrder.value ? 'tender' : (tenderAccessible.value ? routeStore.active : 'tezkor'),
)

onMounted(() => {
  void loadCatalog()
})
watch([() => auth.isAuthenticated, serviceType, targetAgentId, placementIds], loadCatalog)

async function handleSubmit(payload: CreateOrderPayload) {
  haptic('light')
  const order = await orders.create(payload)

  if (order) {
    haptic('medium')
    createdOrder.value = order
    submitted.value = true
    if (isPlacementOrder.value) selection.clear()
    // Let the success screen breathe, then send the user to their orders.
    setTimeout(() => router.replace(ROUTES.orders), 2400)
  }
  else {
    haptic('heavy')
    toast.error(orders.error || locale.t.route.errAction)
  }
}
</script>

<template>
  <div>
    <AppHeader
      :title="locale.t.orders.placeOrderTitle"
      :subtitle="headerSubtitle"
      show-back
    />

    <section class="space-y-5 px-5">
      <!-- Success -->
      <GlassCard
        v-if="submitted"
        class="space-y-4 text-center"
      >
        <div class="mx-auto flex size-14 items-center justify-center rounded-full bg-success/15 text-success">
          <CircleCheck class="size-8" />
        </div>
        <div class="space-y-1">
          <h2 class="rb-font-display text-xl font-bold tracking-tight">
            {{ locale.t.orders.successTitle }}
          </h2>
          <p
            v-if="createdOrder"
            class="text-sm font-semibold tabular-nums text-muted-foreground"
          >
            #{{ createdOrder.id }}
          </p>
        </div>
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

      <!-- Tender | Tezkor + the request form -->
      <template v-else>
        <OrderForm
          :categories="categories"
          :regions="regions"
          :submitting="orders.isSubmitting"
          :target-agent="targetAgent"
          :route="activeRoute"
          :placements="placements"
          @submit="handleSubmit"
        >
          <template
            v-if="tenderAccessible && !isPlacementOrder"
            #route-tabs
          >
            <OrderRouteTabs
              :model-value="routeStore.active"
              @update:model-value="routeStore.set"
            />
          </template>
        </OrderForm>
      </template>
    </section>
  </div>
</template>
