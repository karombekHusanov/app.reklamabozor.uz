<script setup lang="ts">
import { ArrowRight, CircleCheck, Clock, Lock, LogIn } from '@lucide/vue'
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
import type { Category } from '@/modules/agent/types/agent'
import type { CreateOrderPayload, Order } from '@/modules/orders/types/order'
import type { Region } from '@/modules/orders/types/region'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const orders = useOrdersStore()
const locale = useLocaleStore()
const { haptic } = useTelegram()
const toast = useToast()
const routeStore = useOrderRouteStore()

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
const regions = ref<Region[]>([])
const targetAgent = ref<{ id: number, company_name: string } | null>(null)
const loadingCategories = ref(false)
const submitted = ref(false)
const createdOrder = ref<Order | null>(null)

const headerSubtitle = computed(() => {
  if (targetAgent.value) return targetAgent.value.company_name
  return serviceType.value === 'designer' ? locale.t.orders.findDesigner : locale.t.orders.findAgency
})

async function loadCatalog() {
  if (!auth.isAuthenticated) return
  loadingCategories.value = true
  try {
    const regionsPromise = fetchRegions().catch(() => [] as Region[])

    if (targetAgentId.value !== null) {
      // Directed order — prefer the agency's categories; fall back to the full
      // catalog when the profile has none configured yet.
      const agent = await fetchPublicAgent(targetAgentId.value)
      targetAgent.value = { id: agent.id, company_name: agent.display_name }
      const [cats, regs] = await Promise.all([
        agent.categories.length > 0
          ? Promise.resolve(agent.categories)
          : fetchCategories(agent.provider_type),
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
 * Tender | Tezkor. Tender needs manager-granted access: with access it is the
 * default tab; without, it shows locked and Tezkor is the default. Picking the
 * locked tab explains why and offers the access request (the backend would
 * refuse a tender from this account with 403).
 */
const tenderAccessible = computed(() => routeStore.canCreateTender)
const showTenderLock = computed(() => routeStore.active === 'tender' && !tenderAccessible.value)

const tenderLockCopy = computed(() => {
  if (routeStore.tenderStatus === 'pending') return locale.t.route.accessPending
  if (routeStore.tenderStatus === 'revoked') return locale.t.route.accessRevoked
  return locale.t.route.lockedBody
})

function requestTenderAccess() {
  haptic('light')
  void router.push({ path: ROUTES.profile, query: { tender: '1' } })
}

function useTezkor() {
  haptic('light')
  routeStore.set('tezkor')
}

onMounted(() => {
  void loadCatalog()
})
watch([() => auth.isAuthenticated, serviceType, targetAgentId], loadCatalog)

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

      <!-- Tender | Tezkor + the request form -->
      <template v-else>
        <OrderRouteTabs
          :model-value="routeStore.active"
          :tender-locked="!tenderAccessible"
          @update:model-value="routeStore.set"
        />

        <GlassCard
          v-if="showTenderLock"
          class="tender-lock"
        >
          <span
            class="tender-lock__ic"
            aria-hidden="true"
          ><Lock class="size-6" /></span>
          <h2 class="tender-lock__title">
            {{ locale.t.route.tenderLocked }}
          </h2>
          <p class="tender-lock__body">
            <Clock
              v-if="routeStore.tenderStatus === 'pending'"
              class="mr-1 inline size-4 align-[-3px]"
            />
            {{ tenderLockCopy }}
          </p>
          <div class="tender-lock__perks">
            <span>{{ locale.t.landing.td1 }}</span>
            <span>{{ locale.t.landing.td2 }}</span>
            <span>{{ locale.t.landing.td3 }}</span>
          </div>
          <button
            v-if="routeStore.tenderStatus !== 'pending'"
            type="button"
            class="rb-primary-btn w-full"
            @click="requestTenderAccess"
          >
            {{ locale.t.route.requestAccess }}
            <ArrowRight class="size-4" />
          </button>
          <button
            type="button"
            class="tender-lock__alt"
            @click="useTezkor"
          >
            {{ locale.t.orders.useTezkorInstead }}
          </button>
        </GlassCard>

        <OrderForm
          v-else
          :categories="categories"
          :regions="regions"
          :submitting="orders.isSubmitting"
          :target-agent="targetAgent"
          :route="routeStore.active"
          @submit="handleSubmit"
        />
      </template>
    </section>
  </div>
</template>

<style scoped>
.tender-lock { display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center; padding-block: 22px; }
.tender-lock__ic { display: grid; place-items: center; width: 56px; height: 56px; border-radius: 18px; background: var(--secondary); color: var(--primary); }
.tender-lock__title { margin: 4px 0 0; font-family: var(--rb-font-display); font-size: 19px; font-weight: 800; letter-spacing: -0.015em; color: var(--foreground); }
.tender-lock__body { margin: 0; max-width: 300px; font-size: 13px; line-height: 1.5; color: var(--muted-foreground); }
.tender-lock__perks { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; margin: 4px 0 6px; }
.tender-lock__perks span {
  padding: 5px 10px; border-radius: var(--rb-r-chip); background: var(--secondary); color: var(--secondary-foreground);
  font-size: 11.5px; font-weight: 700;
}
.tender-lock__alt {
  min-height: 44px; padding: 0 12px; border: 0; background: none; cursor: pointer;
  font-size: 13.5px; font-weight: 700; color: var(--primary);
}
</style>
