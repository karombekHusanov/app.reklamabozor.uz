import { computed, onMounted, ref, watch, type Ref } from 'vue'
import {
  datesFromPreset,
  EMPTY_LIVE_ORDERS_FILTERS,
  isFilterActive,
  type LiveOrdersFilterState,
} from '@/modules/home/lib/live-orders-filters'
import { fetchLiveOrders, type LiveOrder } from '@/modules/home/services/live-orders.service'
import { fetchCategories } from '@/modules/orders/services/orders.service'
import { fetchRegions } from '@/modules/orders/services/regions.service'
import type { OrderRoute } from '@/modules/orders/types/order'
import type { Category } from '@/modules/agent/types/agent'
import type { Region } from '@/modules/orders/types/region'

const SEARCH_DEBOUNCE_MS = 300
const LIMIT = 50

/**
 * Showcase feed state shared by the Live Orders page and the agent home:
 * debounced search, filter drawer state, route filter (`null` = all) and loading.
 */
export function useLiveOrdersFeed(route: Ref<OrderRoute | null>, onLoaded?: (orders: LiveOrder[], filtered: boolean) => void) {
  const orders = ref<LiveOrder[]>([])
  const categories = ref<Category[]>([])
  const regions = ref<Region[]>([])
  const searchQuery = ref('')
  const debouncedQuery = ref('')
  const filters = ref<LiveOrdersFilterState>({ ...EMPTY_LIVE_ORDERS_FILTERS })
  const loading = ref(true)

  const filtersActive = computed(() => isFilterActive(filters.value))
  const hasActiveQuery = computed(() => debouncedQuery.value.trim().length > 0)

  let searchTimer: ReturnType<typeof setTimeout> | null = null
  watch(searchQuery, (value) => {
    if (searchTimer) clearTimeout(searchTimer)
    searchTimer = setTimeout(() => { debouncedQuery.value = value }, SEARCH_DEBOUNCE_MS)
  })

  async function load() {
    loading.value = true
    try {
      const dates = datesFromPreset(filters.value.datePreset)
      orders.value = await fetchLiveOrders(LIMIT, {
        route: route.value,
        q: debouncedQuery.value.trim() || null,
        category_ids: filters.value.categoryIds,
        region_id: filters.value.regionId,
        district_id: filters.value.districtId,
        created_from: dates.created_from,
        created_to: dates.created_to,
      })
      onLoaded?.(orders.value, hasActiveQuery.value || filtersActive.value)
    }
    catch {
      orders.value = []
    }
    finally {
      loading.value = false
    }
  }

  onMounted(async () => {
    const [categoriesResult, regionsResult] = await Promise.allSettled([fetchCategories(), fetchRegions()])
    categories.value = categoriesResult.status === 'fulfilled' ? categoriesResult.value : []
    regions.value = regionsResult.status === 'fulfilled' ? regionsResult.value : []
    await load()
  })

  watch([debouncedQuery, filters, route], () => { void load() }, { deep: true })

  return { orders, categories, regions, searchQuery, filters, loading, filtersActive, hasActiveQuery, load }
}
