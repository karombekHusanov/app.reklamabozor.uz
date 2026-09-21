import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getApiErrorMessage } from '@/core/api/api-error'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useOrderRouteStore } from '@/modules/orders/stores/order-route.store'
import { type Banner, fetchBanners } from '@/modules/home/services/banners.service'
import {
  fetchMyActivity,
  markLiveOrdersSeen as markLiveOrdersSeenApi,
  type UserActivity,
} from '@/modules/home/services/activity.service'
import { fetchPlatformContact, type PlatformContact } from '@/modules/home/services/platform-contact.service'
import { fetchLiveOrders, type LiveOrder } from '@/modules/home/services/live-orders.service'
import { fetchTopAgents, type PublicAgent } from '@/modules/marketplace/services/agents.service'

const TOP_AGENTS_LIMIT = 5
const LIVE_ORDERS_LIMIT = 10

const emptyActivityBadges = () => ({
  newLiveOrdersCount: 0,
  unreadChats: 0,
  unreadGlobal: 0,
  myOrdersCount: 0,
  notificationCount: 0,
  providerApproved: false,
  /** Pending offers waiting on the client — useful pulse for provider Offers dock. */
  offersPending: 0,
})

/**
 * Home marketplace bootstrap + badge counters.
 * Badges come from GET /me/activity — do not pull full order/chat lists here.
 */
export const useHomeStore = defineStore('home', () => {
  const banners = ref<Banner[]>([])
  const topAgents = ref<PublicAgent[]>([])
  const topDesigners = ref<PublicAgent[]>([])
  const liveOrders = ref<LiveOrder[]>([])
  const platformContact = ref<PlatformContact | null>(null)
  const activity = ref<UserActivity | null>(null)

  const newLiveOrdersCount = ref(0)
  const unreadChats = ref(0)
  const unreadGlobal = ref(0)
  const myOrdersCount = ref(0)
  const notificationCount = ref(0)
  const providerApproved = ref(false)
  const offersPending = ref(0)

  const hasLoaded = ref(false)
  const isLoading = ref(false)
  const isRefreshing = ref(false)
  const error = ref<string | null>(null)

  /** One in-flight home load — prevents mount + auth-watch double fetch. */
  let loadInflight: Promise<void> | null = null
  let activityInflight: Promise<void> | null = null

  function applyActivity(data: UserActivity | null) {
    activity.value = data
    if (!data) {
      const empty = emptyActivityBadges()
      newLiveOrdersCount.value = empty.newLiveOrdersCount
      unreadChats.value = empty.unreadChats
      unreadGlobal.value = empty.unreadGlobal
      myOrdersCount.value = empty.myOrdersCount
      notificationCount.value = empty.notificationCount
      providerApproved.value = empty.providerApproved
      offersPending.value = empty.offersPending
      return
    }

    newLiveOrdersCount.value = data.live_orders?.count ?? 0
    unreadChats.value = data.chats?.unread_messages ?? 0
    unreadGlobal.value = data.chats?.global_unread ?? 0
    myOrdersCount.value = data.client?.orders_total ?? 0
    notificationCount.value = data.notifications?.unread ?? 0
    providerApproved.value = data.provider?.profile_status === 'approved'
    offersPending.value = data.provider?.offers_pending ?? 0
  }

  async function loadActivity(force = false) {
    const auth = useAuthStore()
    if (!auth.isAuthenticated) {
      applyActivity(null)
      return
    }

    if (activityInflight && !force) return activityInflight

    activityInflight = (async () => {
      try {
        const data = await fetchMyActivity(
          auth.user?.role ? { role: auth.user.role } : undefined,
        )
        applyActivity(data)
      }
      catch {
        // Badge is non-critical — keep previous value on transient errors.
      }
    })().finally(() => {
      activityInflight = null
    })

    return activityInflight
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
        const auth = useAuthStore()
        const activityPromise = auth.isAuthenticated
          ? loadActivity(force)
          : Promise.resolve()

        const [bannersData, agentsData, designersData, liveOrdersData, contactData] = await Promise.all([
          fetchBanners().catch(() => [] as Banner[]),
          fetchTopAgents(TOP_AGENTS_LIMIT, undefined, 'agent').catch(() => [] as PublicAgent[]),
          fetchTopAgents(TOP_AGENTS_LIMIT, undefined, 'designer').catch(() => [] as PublicAgent[]),
          fetchLiveOrders(LIVE_ORDERS_LIMIT, { route: useOrderRouteStore().active }).catch(() => [] as LiveOrder[]),
          fetchPlatformContact().catch(() => null),
        ])

        await activityPromise

        banners.value = bannersData
        topAgents.value = agentsData
        topDesigners.value = designersData
        liveOrders.value = liveOrdersData
        platformContact.value = contactData
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

  /** Re-fetch just the live-requests rail (Tender | Tezkor tab switch). */
  async function loadLiveOrders() {
    try {
      liveOrders.value = await fetchLiveOrders(LIVE_ORDERS_LIMIT, { route: useOrderRouteStore().active })
    }
    catch {
      liveOrders.value = []
    }
  }

  async function refresh() {
    await load({ force: true })
  }

  async function markLiveOrdersSeen() {
    newLiveOrdersCount.value = 0
    const auth = useAuthStore()
    if (!auth.isAuthenticated) return

    try {
      const result = await markLiveOrdersSeenApi()
      if (activity.value) {
        activity.value = {
          ...activity.value,
          live_orders: {
            count: 0,
            last_seen_at: result.last_seen_at,
          },
        }
      }
    }
    catch {
      // Optimistic clear already applied; next activity fetch will reconcile.
    }
  }

  function reset() {
    banners.value = []
    topAgents.value = []
    topDesigners.value = []
    liveOrders.value = []
    platformContact.value = null
    applyActivity(null)
    hasLoaded.value = false
    isLoading.value = false
    isRefreshing.value = false
    error.value = null
    loadInflight = null
    activityInflight = null
  }

  return {
    banners,
    topAgents,
    topDesigners,
    liveOrders,
    platformContact,
    activity,
    newLiveOrdersCount,
    unreadChats,
    unreadGlobal,
    myOrdersCount,
    notificationCount,
    providerApproved,
    offersPending,
    isProviderApproved: computed(() => providerApproved.value),
    hasLoaded,
    isLoading,
    isRefreshing,
    error,
    load,
    refresh,
    loadActivity,
    loadLiveOrders,
    markLiveOrdersSeen,
    reset,
  }
})
