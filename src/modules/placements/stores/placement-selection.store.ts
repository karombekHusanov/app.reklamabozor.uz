import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type { AdFormat, Placement, SelectedFormat } from '@/modules/placements/types/placement'

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

const FORMATS_STORAGE_KEY = 'adspace_format_selection'

function restoreFormats(): SelectedFormat[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(FORMATS_STORAGE_KEY) ?? '[]') as unknown
    return Array.isArray(parsed)
      ? (parsed as SelectedFormat[]).filter(f => typeof f?.format?.id === 'number' && f.quantity > 0)
      : []
  }
  catch {
    return []
  }
}

/**
 * The client's "basket" of screens picked on the map, carried into the order
 * form (`/orders/new?placements=1,2,3`). Survives a reload via localStorage
 * (best effort — the Telegram WebView may drop it); cleared once the order is
 * sent. Metro formats picked for the calculator live beside the screens
 * (`formats`, with a quantity each) — the map basket only counts screens.
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

  const formats = ref<SelectedFormat[]>(restoreFormats())
  const formatCount = computed(() => formats.value.length)
  /** Nothing at all to calculate — neither screens nor metro formats. */
  const nothingPicked = computed(() => items.value.length === 0 && formats.value.length === 0)

  watch(formats, (list) => {
    try {
      localStorage.setItem(FORMATS_STORAGE_KEY, JSON.stringify(list))
    }
    catch { /* storage unavailable */ }
  }, { deep: true })

  function formatQuantity(id: number) {
    return formats.value.find(f => f.format.id === id)?.quantity ?? 0
  }

  /** Set how many units of a format are picked; 0 removes it. Packages are always 1. */
  function setFormat(format: AdFormat, quantity: number) {
    const capped = format.is_package ? Math.min(1, quantity) : Math.min(format.total_count, quantity)
    const rest = formats.value.filter(f => f.format.id !== format.id)
    const existing = formats.value.find(f => f.format.id === format.id)
    if (capped <= 0) formats.value = rest
    else if (existing) existing.quantity = capped
    else formats.value = [...rest, { format, quantity: capped }]
  }

  function removeFormat(id: number) {
    formats.value = formats.value.filter(f => f.format.id !== id)
  }

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

  return {
    items, ids, count, isEmpty, singlePlatformOwner, has, add, remove, toggle, keep, clear,
    formats, formatCount, nothingPicked, formatQuantity, setFormat, removeFormat,
  }
})
