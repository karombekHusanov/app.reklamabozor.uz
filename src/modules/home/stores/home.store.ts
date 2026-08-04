import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getApiErrorMessage } from '@/core/api/api-error'
import { useAgentStore } from '@/modules/agent/stores/agent.store'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useChatStore } from '@/modules/chat/stores/chat.store'
import { useNotificationsStore } from '@/modules/notifications/stores/notifications.store'
import { type Banner, fetchBanners } from '@/modules/home/services/banners.service'
import {
  readLiveOrdersSeenAt,
  writeLiveOrdersSeenAt,
} from '@/modules/home/lib/live-orders-seen'
import { fetchLiveOrders, type LiveOrder } from '@/modules/home/services/live-orders.service'
import { holdsBusinessRole } from '@/modules/auth/types/user'
import { fetchTopAgents, type PublicAgent } from '@/modules/marketplace/services/agents.service'
import { useOrdersStore } from '@/modules/orders/stores/orders.store'

const TOP_AGENTS_LIMIT = 5
const LIVE_ORDERS_LIMIT = 10

export const useHomeStore = defineStore('home', () => {
  const banners = ref<Banner[]>([])
  const topAgents = ref<PublicAgent[]>([])
  const topDesigners = ref<PublicAgent[]>([])
  const liveOrders = ref<LiveOrder[]>([])
  /** ISO timestamp — last time the user opened the Live Orders list. */
  const liveOrdersSeenAt = ref<string | null>(readLiveOrdersSeenAt())
  const hasLoaded = ref(false)
  const isLoading = ref(false)
  const isRefreshing = ref(false)
  const error = ref<string | null>(null)

  /**
   * Orders newer than the last list visit. Own orders are excluded.
   * First visit (no seen marker): all non-own feed items count as new.
   */
  const newLiveOrdersCount = computed(() => {
    const auth = useAuthStore()
    const myId = auth.user?.id
    const seenMs = liveOrdersSeenAt.value ? Date.parse(liveOrdersSeenAt.value) : null
    const seenValid = seenMs != null && !Number.isNaN(seenMs)

    return liveOrders.value.filter((order) => {
      if (myId != null && order.client?.id === myId) return false
      if (!seenValid) return true
      const created = Date.parse(order.created_at)
      return !Number.isNaN(created) && created > seenMs!
    }).length
  })

  function markLiveOrdersSeen() {
    const now = new Date().toISOString()
    liveOrdersSeenAt.value = now
    writeLiveOrdersSeenAt(now)
  }

  /** One in-flight home load — prevents mount + auth-watch double fetch. */
  let loadInflight: Promise<void> | null = null

  async function loadUserContext(force: boolean) {
    const auth = useAuthStore()
    if (!auth.isAuthenticated) return

    const agent = useAgentStore()
    const orders = useOrdersStore()
    const notifications = useNotificationsStore()
    const chat = useChatStore()
    // Multirole: profile/workspace may exist even when active role is client.
    const mayHaveProviderProfile = auth.user ? holdsBusinessRole(auth.user) : false

    await Promise.all([
      orders.loadMyOrders(force),
      notifications.load(force),
      mayHaveProviderProfile ? agent.loadProfile(force) : Promise.resolve(),
      // Chat badges live with the rest of the home bootstrap — one place only.
      chat.loadBadges(force),
    ])

    if (mayHaveProviderProfile && agent.isApproved) {
      await orders.loadAgentWorkspace(force)
    }
  }

  async function load(options: { force?: boolean } = {}) {
    const force = options.force ?? false
    if (hasLoaded.value && !force) return
    if (loadInflight) return loadInflight

    loadInflight = (async () => {
      const initial = !hasLoaded.value
      isLoading.value = initial
      isRefreshing.value = !initial && force
      error.value = null

      try {
        const [bannersData, agentsData, designersData, liveOrdersData] = await Promise.all([
          fetchBanners().catch(() => [] as Banner[]),
          fetchTopAgents(TOP_AGENTS_LIMIT, undefined, 'agent').catch(() => [] as PublicAgent[]),
          fetchTopAgents(TOP_AGENTS_LIMIT, undefined, 'designer').catch(() => [] as PublicAgent[]),
          fetchLiveOrders(LIVE_ORDERS_LIMIT).catch(() => [] as LiveOrder[]),
        ])

        banners.value = bannersData
        topAgents.value = agentsData
        topDesigners.value = designersData
        liveOrders.value = liveOrdersData
        await loadUserContext(force)
        hasLoaded.value = true
      }
      catch (e) {
        error.value = getApiErrorMessage(e)
      }
      finally {
        isLoading.value = false
        isRefreshing.value = false
      }
    })().finally(() => {
      loadInflight = null
    })

    return loadInflight
  }

  async function refresh() {
    await load({ force: true })
  }

  function reset() {
    banners.value = []
    topAgents.value = []
    topDesigners.value = []
    liveOrders.value = []
    liveOrdersSeenAt.value = readLiveOrdersSeenAt()
    hasLoaded.value = false
    isLoading.value = false
    isRefreshing.value = false
    error.value = null
    loadInflight = null
  }

  return {
    banners,
    topAgents,
    topDesigners,
    liveOrders,
    liveOrdersSeenAt,
    newLiveOrdersCount,
    hasLoaded,
    isLoading,
    isRefreshing,
    error,
    load,
    refresh,
    markLiveOrdersSeen,
    reset,
  }
})
