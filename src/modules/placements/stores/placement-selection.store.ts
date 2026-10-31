import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type { Placement } from '@/modules/placements/types/placement'

const STORAGE_KEY = 'adspace_placement_selection'

function restore(): Placement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as Placement[]).filter(p => typeof p?.id === 'number') : []
  }
  catch {
    return []
  }
}

/**
 * The client's "basket" of screens picked on the map, carried into the order
 * form (`/orders/new?placements=1,2,3`). Survives a reload via localStorage
 * (best effort — the Telegram WebView may drop it); cleared once the order is
 * sent.
 */
export const usePlacementSelectionStore = defineStore('placement-selection', () => {
  const items = ref<Placement[]>(restore())

  const ids = computed(() => items.value.map(p => p.id))
  const count = computed(() => items.value.length)
  const isEmpty = computed(() => items.value.length === 0)

  /** Every selected screen belongs to one agency on PRB → the order is directed. */
  const singlePlatformOwner = computed(() => {
    const owners = new Set(items.value.map(p => (p.owner.on_platform ? p.owner.agent_profile_id : null)))
    return owners.size === 1 && !owners.has(null)
  })

  watch(items, (list) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
    }
    catch { /* storage unavailable */ }
  }, { deep: true })

  function has(id: number) {
    return items.value.some(p => p.id === id)
  }

  function add(placement: Placement) {
    if (!has(placement.id)) items.value.push(placement)
  }

  function remove(id: number) {
    items.value = items.value.filter(p => p.id !== id)
  }

  function toggle(placement: Placement) {
    if (has(placement.id)) remove(placement.id)
    else add(placement)
  }

  /** Keep only the given ids (the order form opened with a subset in its URL). */
  function keep(keepIds: number[]) {
    const set = new Set(keepIds)
    items.value = items.value.filter(p => set.has(p.id))
  }

  function clear() {
    items.value = []
  }

  return { items, ids, count, isEmpty, singlePlatformOwner, has, add, remove, toggle, keep, clear }
})
