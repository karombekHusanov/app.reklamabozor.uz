import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getApiErrorMessage } from '@/core/api/api-error'
import { useAgentStore } from '@/modules/agent/stores/agent.store'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useChatStore } from '@/modules/chat/stores/chat.store'
import { type Banner, fetchBanners } from '@/modules/home/services/banners.service'
import { isBusinessUser } from '@/modules/auth/types/user'
import { fetchTopAgents, type PublicAgent } from '@/modules/marketplace/services/agents.service'
import { useOrdersStore } from '@/modules/orders/stores/orders.store'

const TOP_AGENTS_LIMIT = 5

export const useHomeStore = defineStore('home', () => {
  const banners = ref<Banner[]>([])
  const topAgents = ref<PublicAgent[]>([])
  const hasLoaded = ref(false)
  const isLoading = ref(false)
  const isRefreshing = ref(false)
  const error = ref<string | null>(null)

  async function loadUserContext(force: boolean) {
    const auth = useAuthStore()
    if (!auth.isAuthenticated) return

    const agent = useAgentStore()
    const orders = useOrdersStore()
    const chat = useChatStore()
    const isProvider = auth.user ? isBusinessUser(auth.user) : false

    await Promise.all([
      orders.loadMyOrders(force),
      chat.loadChats(force),
      isProvider ? agent.loadProfile(force) : Promise.resolve(),
    ])

    if (isProvider && agent.isApproved) {
      await orders.loadAgentWorkspace(force)
    }
  }

  async function load(options: { force?: boolean } = {}) {
    const force = options.force ?? false
    if (hasLoaded.value && !force) return

    const initial = !hasLoaded.value
    isLoading.value = initial
    isRefreshing.value = !initial && force
    error.value = null

    try {
      const [bannersData, agentsData] = await Promise.all([
        fetchBanners().catch(() => [] as Banner[]),
        fetchTopAgents(TOP_AGENTS_LIMIT).catch(() => [] as PublicAgent[]),
      ])

      banners.value = bannersData
      topAgents.value = agentsData
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
  }

  async function refresh() {
    await load({ force: true })
  }

  function reset() {
    banners.value = []
    topAgents.value = []
    hasLoaded.value = false
    isLoading.value = false
    isRefreshing.value = false
    error.value = null
  }

  return {
    banners,
    topAgents,
    hasLoaded,
    isLoading,
    isRefreshing,
    error,
    load,
    refresh,
    reset,
  }
})
