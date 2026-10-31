<script setup lang="ts">
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import L from 'leaflet'
import 'leaflet.markercluster'
import { BadgeCheck, Check, ChevronRight, FileText, List, LocateFixed, MapPin, Search, SlidersHorizontal, Star, X, Zap } from '@lucide/vue'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Avatar from '@/core/ui/Avatar.vue'
import Drawer from '@/core/ui/Drawer.vue'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import { useTelegram } from '@/core/composables/useTelegram'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { categoryFullName, categoryName } from '@/core/i18n/category-name'
import { regionName } from '@/core/i18n/region-name'
import { useToast } from '@/core/composables/useToast'
import { getUserLocation, hasLocationAccess, warmupLocationManager } from '@/core/lib/user-location'
import { isInsideTelegram, supportsVersion } from '@/core/lib/telegram-init'
import { fetchTopAgents, type PublicAgent } from '@/modules/marketplace/services/agents.service'
import { fetchCategories } from '@/modules/orders/services/orders.service'
import { fetchLiveOrders, type LiveOrder } from '@/modules/home/services/live-orders.service'
import PlacementBasketBar from '@/modules/placements/components/PlacementBasketBar.vue'
import PlacementSheet from '@/modules/placements/components/PlacementSheet.vue'
import { clusterIcon, placementIcon, shortPrice } from '@/modules/placements/lib/placement-marker'
import { fetchPlacements } from '@/modules/placements/services/placements.service'
import { PLACEMENT_ORDERING_ENABLED } from '@/modules/placements/lib/feature'
import { usePlacementSelectionStore } from '@/modules/placements/stores/placement-selection.store'
import type { Placement } from '@/modules/placements/types/placement'
import { useModeStore } from '@/modules/shell/stores/mode.store'
import { ROUTES } from '@/modules/shell/constants/routes'
import type { Category } from '@/modules/agent/types/agent'

/**
 * One shared map, three layers. Clients: agencies (fuzzy 1 km circles) or
 * advertising screens (exact pins — a structure on a street is public, and the
 * client orders *that* screen). Executors (agent mode): open requests (fuzzy).
 * Agency/request locations are never exact here; exact points appear only
 * inside a started deal.
 */

const locale = useLocaleStore()
const router = useRouter()
const toast = useToast()
const { haptic, WebApp } = useTelegram()

const mode = useModeStore()
const showRequests = computed(() => mode.isAgent)

type ClientLayer = 'agencies' | 'screens'
const layer = ref<ClientLayer>('agencies')
const showScreens = computed(() => !showRequests.value && layer.value === 'screens')

const selection = usePlacementSelectionStore()
const placements = ref<Placement[]>([])
const placementsLoaded = ref(false)
const selectedPlacement = ref<Placement | null>(null)
const placementDistrict = ref<number | null>(null)
const onlyPriced = ref(false)
const placementFiltersOpen = ref(false)

const selectedAgent = ref<PublicAgent | null>(null)
const selectedOrder = ref<LiveOrder | null>(null)
const hasSelection = computed(() => selectedAgent.value !== null || selectedOrder.value !== null || selectedPlacement.value !== null)
/** Basket bar shows while screens are picked and no card is open (map ordering flag). */
const showBasket = computed(() => PLACEMENT_ORDERING_ENABLED && showScreens.value && !selection.isEmpty && !hasSelection.value)

const OPEN_STATUSES = new Set(['new', 'offers_sent'])
const DEFAULT_RADIUS_M = 1000

const selectedRating = computed(() =>
  selectedAgent.value ? (4.5 + (selectedAgent.value.completion_percent / 100) * 0.5).toFixed(1) : '',
)
const selectedCategory = computed(() =>
  selectedAgent.value?.categories[0] ? categoryName(selectedAgent.value.categories[0], locale.locale) : '',
)

function selectAgent(agent: PublicAgent) {
  haptic('light')
  selectedOrder.value = null
  selectedAgent.value = agent
  map?.panTo([Number(agent.lat), Number(agent.lng)], { animate: true })
}

function selectOrder(order: LiveOrder) {
  haptic('light')
  selectedAgent.value = null
  selectedOrder.value = order
  map?.panTo([Number(order.lat), Number(order.lng)], { animate: true })
}

function openOrder(order: LiveOrder) {
  haptic('medium')
  router.push(ROUTES.liveOrderDetail(order.id))
}

function clearSelection() {
  selectedAgent.value = null
  selectedOrder.value = null
  selectedPlacement.value = null
}

// --- Screens layer -----------------------------------------------------------

const placementDistricts = computed(() => {
  const seen = new Map<number, { id: number, name: string }>()
  for (const p of placements.value) {
    if (p.district && !seen.has(p.district.id)) seen.set(p.district.id, { id: p.district.id, name: regionName(p.district, locale.locale) })
  }
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name))
})

const placementDistrictLabel = computed(() =>
  placementDistricts.value.find(d => d.id === placementDistrict.value)?.name ?? locale.t.placements.allDistricts,
)

const filteredPlacements = computed(() => {
  const q = query.value.trim().toLowerCase()
  return placements.value.filter((p) => {
    if (placementDistrict.value !== null && p.district?.id !== placementDistrict.value) return false
    if (onlyPriced.value && !p.has_price) return false
    return !q || p.address.toLowerCase().includes(q) || p.owner.name.toLowerCase().includes(q)
  })
})

const selectedGroupSize = computed(() => {
  const key = selectedPlacement.value?.group_key
  return key ? placements.value.filter(p => p.group_key === key).length : 1
})

function selectPlacement(placement: Placement) {
  haptic('light')
  selectedAgent.value = null
  selectedOrder.value = null
  selectedPlacement.value = placement
}

/** From the basket list: fly to the screen and open its card. */
function focusPlacement(id: number) {
  const placement = placements.value.find(p => p.id === id)
  if (!placement || !map) return
  map.setView([Number(placement.lat), Number(placement.lng)], 17, { animate: true })
  selectPlacement(placement)
}

function pickLayer(next: ClientLayer) {
  if (layer.value === next) return
  haptic('light')
  layer.value = next
  clearSelection()
}

function pickPlacementDistrict(id: number | null) {
  haptic('light')
  placementDistrict.value = id
  placementFiltersOpen.value = false
}

async function loadPlacements() {
  if (placementsLoaded.value) return
  try {
    placements.value = await fetchPlacements()
    placementsLoaded.value = true
  }
  catch {
    toast.error(locale.t.placements.loadError)
  }
}

function renderPlacements() {
  if (!map || !placementLayer) return
  placementLayer.clearLayers()
  if (!showScreens.value) return

  for (const p of filteredPlacements.value) {
    const lat = Number(p.lat)
    const lng = Number(p.lng)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue
    const marker = L.marker([lat, lng], {
      icon: placementIcon({ selected: selection.has(p.id), priced: p.has_price, label: shortPrice(p.min_day_price_som) }),
      zIndexOffset: selection.has(p.id) ? 500 : 0,
    })
    ;(marker as L.Marker & { placementId?: number }).placementId = p.id
    marker.on('click', () => selectPlacement(p))
    placementLayer.addLayer(marker)
  }
}

const selectedOrderCategory = computed(() =>
  selectedOrder.value?.category ? categoryFullName(selectedOrder.value.category, locale.locale) : '',
)

function openAgent(agent: PublicAgent) {
  haptic('medium')
  router.push(`/agents/${agent.id}`)
}

const DEFAULT_CENTER: L.LatLngTuple = [41.311081, 69.279716]
const USER_ZOOM = 16
const FALLBACK_ZOOM = 14

const mapEl = ref<HTMLElement | null>(null)
let map: L.Map | null = null
let markerLayer: L.LayerGroup | null = null
let userLocationLayer: L.LayerGroup | null = null
let placementLayer: L.MarkerClusterGroup | null = null

const agents = ref<PublicAgent[]>([])
const orders = ref<LiveOrder[]>([])
/** Full agent-type catalog — not derived from loaded markers. */
const categories = ref<Category[]>([])
const query = ref('')
const activeCategory = ref<number | null>(null)
const locating = ref(false)
const categoryDrawerOpen = ref(false)

// Area badge at a circle's centre — round, no pointer tip: the centre is not
// the exact point, only a tap target for the shaded area around it.
const AGENCY_BADGE = L.divIcon({
  className: 'rb-area-badge',
  html: `<img src="/brand/prb-logo-circle.png" style="width:30px;height:30px;border-radius:9999px;box-shadow:0 3px 8px rgba(2,48,92,.35);border:2px solid #fff" />`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
})

const REQUEST_BADGE = L.divIcon({
  className: 'rb-area-badge',
  html: `<div style="width:30px;height:30px;border-radius:9999px;background:#E9601A;border:2px solid #fff;box-shadow:0 3px 8px rgba(140,52,8,.4);display:flex;align-items:center;justify-content:center;color:#fff;font:700 13px/1 sans-serif">•</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
})

const USER_PIN = L.divIcon({
  className: 'rb-user-location',
  html: `<div class="rb-user-location__wrap">
    <span class="rb-user-location__pulse"></span>
    <span class="rb-user-location__dot"></span>
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})

const categoryOptions = computed(() =>
  categories.value.map(category => ({
    id: category.id,
    name: categoryName(category, locale.locale),
  })),
)

const activeCategoryLabel = computed(() => {
  if (activeCategory.value === null) return locale.t.map.allCategories
  return categoryOptions.value.find(category => category.id === activeCategory.value)?.name
    ?? locale.t.map.allCategories
})

const filteredAgents = computed(() => {
  const q = query.value.trim().toLowerCase()
  return agents.value.filter((a) => {
    const lat = Number(a.lat)
    const lng = Number(a.lng)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false

    const matchCat = activeCategory.value === null || a.categories.some(c => c.id === activeCategory.value)
    const matchQ = !q
      || a.display_name.toLowerCase().includes(q)
      || (a.location_label?.toLowerCase().includes(q) ?? false)
    return matchCat && matchQ
  })
})

const filteredOrders = computed(() => {
  const q = query.value.trim().toLowerCase()
  return orders.value.filter((o) => {
    const lat = Number(o.lat)
    const lng = Number(o.lng)
    if (o.lat == null || o.lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) return false
    if (!OPEN_STATUSES.has(o.status)) return false

    const matchCat = activeCategory.value === null || o.category?.id === activeCategory.value
    const matchQ = !q
      || o.title.toLowerCase().includes(q)
      || (o.description?.toLowerCase().includes(q) ?? false)
    return matchCat && matchQ
  })
})

/** A shaded circle (the public area) with a round badge at its centre. */
function drawArea(lat: number, lng: number, radius: number | null | undefined, tone: 'agency' | 'request', onTap: () => void) {
  if (!markerLayer) return
  const color = tone === 'agency' ? '#2563eb' : '#E9601A'
  L.circle([lat, lng], {
    radius: radius && radius > 0 ? radius : DEFAULT_RADIUS_M,
    color,
    weight: 1.5,
    fillColor: color,
    fillOpacity: 0.14,
  }).on('click', (e) => {
    L.DomEvent.stopPropagation(e)
    onTap()
  }).addTo(markerLayer)
  L.marker([lat, lng], { icon: tone === 'agency' ? AGENCY_BADGE : REQUEST_BADGE })
    .on('click', onTap)
    .addTo(markerLayer)
}

function renderMarkers() {
  if (!map || !markerLayer) return
  markerLayer.clearLayers()
  if (showScreens.value) return
  if (showRequests.value) {
    for (const o of filteredOrders.value) {
      drawArea(Number(o.lat), Number(o.lng), o.location_radius_m, 'request', () => selectOrder(o))
    }
    return
  }
  for (const a of filteredAgents.value) {
    drawArea(Number(a.lat), Number(a.lng), a.location_radius_m, 'agency', () => selectAgent(a))
  }
}

function renderUserLocation(lat: number, lng: number, accuracy?: number) {
  if (!map || !userLocationLayer) return
  userLocationLayer.clearLayers()

  if (accuracy && accuracy > 0) {
    L.circle([lat, lng], {
      radius: accuracy,
      color: '#0b6bcb',
      fillColor: '#0b6bcb',
      fillOpacity: 0.1,
      weight: 1,
    }).addTo(userLocationLayer)
  }

  L.marker([lat, lng], { icon: USER_PIN, zIndexOffset: 1000 }).addTo(userLocationLayer)
}

async function centerOnUser() {
  if (!map || locating.value) return
  locating.value = true
  haptic('light')

  const coords = await getUserLocation()
  locating.value = false

  if (!coords || !map) {
    toast.error(locale.t.ui.errLocation)

    // Permission denied in Telegram — offer to open location settings (user gesture).
    try {
      if (isInsideTelegram() && supportsVersion('8.0')) {
        const manager = WebApp.LocationManager
        if (manager?.isInited && manager.isAccessRequested && !manager.isAccessGranted) {
          manager.openSettings()
        }
      }
    }
    catch { /* unsupported client */ }
    return
  }

  map.setView([coords.lat, coords.lng], USER_ZOOM, { animate: true })
  renderUserLocation(coords.lat, coords.lng, coords.accuracy)
}

function pickCategory(id: number | null) {
  haptic('light')
  activeCategory.value = id
  categoryDrawerOpen.value = false
}

async function load() {
  if (showRequests.value) {
    const [ordersResult, categoriesResult] = await Promise.allSettled([
      fetchLiveOrders(50),
      fetchCategories(),
    ])
    orders.value = ordersResult.status === 'fulfilled' ? ordersResult.value : []
    categories.value = categoriesResult.status === 'fulfilled' ? categoriesResult.value : []
    return
  }

  const [agentsResult, categoriesResult] = await Promise.allSettled([
    fetchTopAgents(50),
    fetchCategories('agent'),
  ])

  agents.value = agentsResult.status === 'fulfilled' ? agentsResult.value : []
  categories.value = categoriesResult.status === 'fulfilled' ? categoriesResult.value : []
}

onMounted(async () => {
  if (!mapEl.value) return

  map = L.map(mapEl.value, { zoomControl: false, attributionControl: true })
    .setView(DEFAULT_CENTER, FALLBACK_ZOOM)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
    maxZoom: 19,
  }).addTo(map)

  markerLayer = L.layerGroup().addTo(map)
  userLocationLayer = L.layerGroup().addTo(map)
  // 300+ screens city-wide: cluster into district bubbles until street zoom;
  // two faces of one pole spiderfy at max zoom instead of overlapping.
  placementLayer = L.markerClusterGroup({
    showCoverageOnHover: false,
    spiderfyOnMaxZoom: true,
    disableClusteringAtZoom: 16,
    maxClusterRadius: 60,
    iconCreateFunction: (cluster) => {
      const markers = cluster.getAllChildMarkers() as Array<L.Marker & { placementId?: number }>
      const hasSelected = markers.some(m => m.placementId !== undefined && selection.has(m.placementId))
      return clusterIcon(cluster.getChildCount(), hasSelected)
    },
  }).addTo(map)

  map.on('click', clearSelection)

  await warmupLocationManager()

  await nextTick()
  map.invalidateSize()
  // Leaflet often needs a second pass after the page transition settles.
  requestAnimationFrame(() => map?.invalidateSize())

  await load()
  renderMarkers()

  // Only auto-center when permission was already granted — first-time prompts need a tap.
  if (hasLocationAccess()) {
    await centerOnUser()
  }
})

watch(filteredAgents, (list) => {
  if (showRequests.value) return
  renderMarkers()
  if (selectedAgent.value && !list.some(a => a.id === selectedAgent.value!.id)) {
    selectedAgent.value = null
  }
})

watch(filteredOrders, (list) => {
  if (!showRequests.value) return
  renderMarkers()
  if (selectedOrder.value && !list.some(o => o.id === selectedOrder.value!.id)) {
    selectedOrder.value = null
  }
})

// Screens layer: load on first switch, redraw on filter/selection changes.
watch(showScreens, async (on) => {
  if (on) await loadPlacements()
  renderMarkers()
  renderPlacements()
})

watch([filteredPlacements, () => selection.ids], ([list]) => {
  if (!showScreens.value) return
  renderPlacements()
  if (selectedPlacement.value && !list.some(p => p.id === selectedPlacement.value!.id)) {
    selectedPlacement.value = null
  }
})

onBeforeUnmount(() => {
  map?.remove()
  map = null
  markerLayer = null
  userLocationLayer = null
  placementLayer = null
})
</script>

<template>
  <div class="fixed inset-0 z-[60] bg-slate-200">
    <div
      ref="mapEl"
      class="absolute inset-0 z-0"
    />

    <AppHeader
      :title="locale.t.shell.tabs.map"
      :subtitle="showRequests ? locale.t.map.requestsSubtitle : (showScreens ? locale.t.placements.subtitle : locale.t.map.subtitle)"
      show-back
    />

    <div class="map-page-search pointer-events-none fixed inset-x-0 z-[45] space-y-2 px-4">
      <div class="pointer-events-auto flex h-11 items-center gap-2.5 rounded-2xl border border-border/60 bg-card/95 px-3.5 shadow-sm backdrop-blur-md">
        <Search class="size-4 shrink-0 text-muted-foreground" />
        <input
          v-model="query"
          type="search"
          :placeholder="locale.t.map.searchPlaceholder"
          class="w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
        >
      </div>

      <!-- Client mode: agencies (fuzzy areas) | screens (exact pins) -->
      <div
        v-if="!showRequests"
        class="map-layer-tabs pointer-events-auto"
        role="tablist"
        :aria-label="locale.t.shell.tabs.map"
      >
        <button
          type="button"
          role="tab"
          class="map-layer-tab"
          :class="layer === 'agencies' && 'is-active'"
          :aria-selected="layer === 'agencies'"
          @click="pickLayer('agencies')"
        >
          {{ locale.t.placements.layerAgencies }}
        </button>
        <button
          type="button"
          role="tab"
          class="map-layer-tab"
          :class="layer === 'screens' && 'is-active'"
          :aria-selected="layer === 'screens'"
          @click="pickLayer('screens')"
        >
          {{ locale.t.placements.layerScreens }}
          <span
            v-if="PLACEMENT_ORDERING_ENABLED && selection.count && layer !== 'screens'"
            class="map-layer-tab__badge"
          >{{ selection.count }}</span>
        </button>
      </div>
    </div>

    <button
      type="button"
      class="absolute right-4 z-[70] flex size-13 items-center justify-center rounded-full bg-primary text-white shadow-xl shadow-[#02305C]/40 transition-all active:scale-95"
      :class="hasSelection || showBasket ? 'bottom-44' : 'bottom-28'"
      @click="centerOnUser"
    >
      <LocateFixed
        class="size-5"
        :class="locating && 'animate-pulse'"
      />
    </button>

    <!-- Screens layer: filters (no selection yet) or the basket bar -->
    <div
      v-if="showScreens && !hasSelection && (!PLACEMENT_ORDERING_ENABLED || selection.isEmpty)"
      class="safe-bottom absolute inset-x-0 bottom-0 z-[70] flex flex-col items-center gap-2 px-6 pb-4"
    >
      <p
        v-if="placementDistrict !== null || onlyPriced"
        class="rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-primary shadow-md"
      >
        {{ placementDistrictLabel }}<template v-if="onlyPriced">
          · {{ locale.t.placements.onlyPriced }}
        </template>
      </p>
      <button
        type="button"
        class="btn-brand flex h-12 w-full max-w-xs items-center justify-center gap-2 rounded-full text-sm font-semibold"
        @click="placementFiltersOpen = true"
      >
        <SlidersHorizontal class="size-5" />
        {{ locale.t.placements.filtersTitle }}
        <span class="rounded-full bg-white/20 px-2 py-0.5 text-xs">{{ filteredPlacements.length }}</span>
      </button>
    </div>

    <Transition name="agent-card">
      <div
        v-if="showBasket"
        class="safe-bottom absolute inset-x-0 bottom-0 z-[75] px-4 pb-4"
      >
        <PlacementBasketBar @focus="focusPlacement" />
      </div>
    </Transition>

    <div
      v-if="!showScreens && !hasSelection"
      class="safe-bottom absolute inset-x-0 bottom-0 z-[70] flex flex-col items-center gap-2 px-6 pb-4"
    >
      <p
        v-if="activeCategory !== null"
        class="rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-primary shadow-md"
      >
        {{ activeCategoryLabel }}
      </p>
      <button
        type="button"
        class="btn-brand flex h-12 w-full max-w-xs items-center justify-center gap-2 rounded-full text-sm font-semibold"
        @click="categoryDrawerOpen = true"
      >
        <List class="size-5" />
        {{ locale.t.map.listView }}
      </button>
    </div>

    <Drawer
      v-model:open="placementFiltersOpen"
      :title="locale.t.placements.filtersTitle"
    >
      <div class="space-y-2 pb-2">
        <button
          type="button"
          class="map-category-option pressable"
          :class="onlyPriced && 'map-category-option--active'"
          @click="onlyPriced = !onlyPriced"
        >
          <span class="min-w-0 flex-1 text-left text-sm font-semibold">{{ locale.t.placements.onlyPriced }}</span>
          <Check
            v-if="onlyPriced"
            class="size-4 shrink-0 text-primary"
          />
        </button>

        <p class="px-1 pt-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          {{ locale.t.placements.districtLabel }}
        </p>
        <button
          type="button"
          class="map-category-option pressable"
          :class="placementDistrict === null && 'map-category-option--active'"
          @click="pickPlacementDistrict(null)"
        >
          <span class="min-w-0 flex-1 text-left text-sm font-semibold">{{ locale.t.placements.allDistricts }}</span>
          <Check
            v-if="placementDistrict === null"
            class="size-4 shrink-0 text-primary"
          />
        </button>
        <button
          v-for="district in placementDistricts"
          :key="district.id"
          type="button"
          class="map-category-option pressable"
          :class="placementDistrict === district.id && 'map-category-option--active'"
          @click="pickPlacementDistrict(district.id)"
        >
          <span class="min-w-0 flex-1 text-left text-sm font-semibold">{{ district.name }}</span>
          <Check
            v-if="placementDistrict === district.id"
            class="size-4 shrink-0 text-primary"
          />
        </button>
      </div>
    </Drawer>

    <Transition name="agent-card">
      <div
        v-if="selectedPlacement"
        class="safe-bottom absolute inset-x-0 bottom-0 z-[75] px-4 pb-4"
      >
        <PlacementSheet
          :placement="selectedPlacement"
          :group-size="selectedGroupSize"
          @close="selectedPlacement = null"
        />
      </div>
    </Transition>

    <Drawer
      v-model:open="categoryDrawerOpen"
      :title="locale.t.map.categoriesTitle"
    >
      <div class="space-y-2 pb-2">
        <button
          type="button"
          class="map-category-option pressable"
          :class="activeCategory === null && 'map-category-option--active'"
          @click="pickCategory(null)"
        >
          <span class="min-w-0 flex-1 text-left text-sm font-semibold">
            {{ locale.t.map.allCategories }}
          </span>
          <Check
            v-if="activeCategory === null"
            class="size-4 shrink-0 text-primary"
          />
        </button>

        <button
          v-for="category in categoryOptions"
          :key="category.id"
          type="button"
          class="map-category-option pressable"
          :class="activeCategory === category.id && 'map-category-option--active'"
          @click="pickCategory(category.id)"
        >
          <span class="min-w-0 flex-1 text-left text-sm font-semibold">
            {{ category.name }}
          </span>
          <Check
            v-if="activeCategory === category.id"
            class="size-4 shrink-0 text-primary"
          />
        </button>
      </div>
    </Drawer>

    <Transition name="agent-card">
      <div
        v-if="selectedAgent"
        class="safe-bottom absolute inset-x-0 bottom-0 z-[75] px-4 pb-4"
      >
        <div class="relative rounded-3xl bg-white p-3 shadow-2xl shadow-[#02305C]/35">
          <button
            type="button"
            class="absolute right-2.5 top-2.5 z-10 flex size-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition active:scale-90"
            :aria-label="locale.t.common.cancel"
            @click.stop="selectedAgent = null"
          >
            <X class="size-4" />
          </button>

          <button
            type="button"
            class="flex w-full items-center gap-3 pr-7 text-left"
            @click="openAgent(selectedAgent)"
          >
            <Avatar
              :src="selectedAgent.company_logo ?? selectedAgent.avatar"
              :name="selectedAgent.display_name"
              size="lg"
              class="!size-[3.75rem] shrink-0 !rounded-2xl"
            />
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-1">
                <p class="truncate font-bold text-slate-900">
                  {{ selectedAgent.display_name }}
                </p>
                <BadgeCheck class="size-4 shrink-0 fill-primary/15 text-primary" />
              </div>
              <div class="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <Star class="size-3.5 fill-amber-400 text-amber-400" />
                <span>{{ selectedRating }}</span>
                <span
                  v-if="selectedCategory"
                  class="truncate font-medium text-slate-500"
                >
                  · {{ selectedCategory }}
                </span>
              </div>
              <!-- District + city only; the circle is the ~1 km area. -->
              <p class="mt-1 flex items-center gap-1 text-xs text-slate-500">
                <MapPin class="size-3.5 shrink-0" />
                <span class="truncate">{{ selectedAgent.location_label ? `${selectedAgent.location_label} · ${locale.t.map.approxAreaShort}` : locale.t.map.approxArea }}</span>
              </p>
            </div>

            <span class="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ChevronRight class="size-5" />
            </span>
          </button>
        </div>
      </div>
    </Transition>

    <!-- Agent mode: a tapped open request (its area, never the exact point). -->
    <Transition name="agent-card">
      <div
        v-if="selectedOrder"
        class="safe-bottom absolute inset-x-0 bottom-0 z-[75] px-4 pb-4"
      >
        <div class="relative rounded-3xl bg-white p-3 shadow-2xl shadow-[#02305C]/35">
          <button
            type="button"
            class="absolute right-2.5 top-2.5 z-10 flex size-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition active:scale-90"
            :aria-label="locale.t.common.cancel"
            @click.stop="selectedOrder = null"
          >
            <X class="size-4" />
          </button>

          <button
            type="button"
            class="flex w-full items-center gap-3 pr-7 text-left"
            @click="openOrder(selectedOrder)"
          >
            <span
              class="flex size-[3.75rem] shrink-0 items-center justify-center rounded-2xl"
              :class="selectedOrder.route === 'tezkor' ? 'bg-orange-100 text-orange-600' : 'bg-primary/10 text-primary'"
            >
              <Zap
                v-if="selectedOrder.route === 'tezkor'"
                class="size-6"
              />
              <FileText
                v-else
                class="size-6"
              />
            </span>
            <div class="min-w-0 flex-1">
              <p class="truncate font-bold text-slate-900">
                {{ selectedOrder.title }}
              </p>
              <p class="mt-0.5 truncate text-xs font-semibold text-slate-700">
                {{ selectedOrder.route === 'tezkor' ? locale.t.route.tezkor : locale.t.route.tender }}<template v-if="selectedOrderCategory">
                  · {{ selectedOrderCategory }}
                </template>
              </p>
              <p class="mt-1 flex items-center gap-1 text-xs text-slate-500">
                <MapPin class="size-3.5 shrink-0" />
                <span class="truncate">{{ locale.t.map.approxArea }}</span>
              </p>
            </div>

            <span class="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ChevronRight class="size-5" />
            </span>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style>
.rb-user-location {
  background: transparent;
  border: none;
}

.rb-area-badge {
  background: transparent;
  border: none;
}

.rb-user-location__wrap {
  position: relative;
  width: 28px;
  height: 28px;
}

.rb-user-location__pulse {
  position: absolute;
  inset: 0;
  border-radius: 9999px;
  background: rgba(11, 107, 203, 0.22);
  animation: rb-user-location-pulse 2s ease-out infinite;
}

.rb-user-location__dot {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 14px;
  height: 14px;
  transform: translate(-50%, -50%);
  border-radius: 9999px;
  border: 3px solid #ffffff;
  background: #0b6bcb;
  box-shadow: 0 2px 8px rgba(2, 48, 92, 0.35);
}

@keyframes rb-user-location-pulse {
  0% {
    transform: scale(0.55);
    opacity: 0.9;
  }
  70% {
    transform: scale(1.35);
    opacity: 0;
  }
  100% {
    transform: scale(1.35);
    opacity: 0;
  }
}

/* --- Advertising screens: exact pins + cluster bubbles ------------------- */
.rb-screen-pin-wrap,
.rb-screen-cluster-wrap {
  background: transparent;
  border: none;
}

.rb-screen-pin {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 28px;
}

.rb-screen-pin__glyph {
  display: block;
  width: 24px;
  height: 18px;
  border-radius: 4px;
  background: var(--primary, #0b6bcb);
  border: 2px solid #fff;
  box-shadow: 0 3px 8px rgba(2, 48, 92, 0.35);
  position: relative;
}

/* Pole under the screen. */
.rb-screen-pin__glyph::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 100%;
  width: 2px;
  height: 9px;
  transform: translateX(-50%);
  background: var(--primary, #0b6bcb);
  box-shadow: 0 1px 2px rgba(2, 48, 92, 0.35);
}

.rb-screen-pin__glyph--lg {
  width: 32px;
  height: 24px;
  border-radius: 6px;
  box-shadow: none;
}

.rb-screen-pin__glyph--lg::after {
  display: none;
}

.rb-screen-pin--unpriced .rb-screen-pin__glyph,
.rb-screen-pin--unpriced .rb-screen-pin__glyph::after {
  background: #64748b;
}

.rb-screen-pin--selected .rb-screen-pin__glyph {
  background: var(--rb-cta, #e9601a);
  outline: 3px solid color-mix(in oklab, var(--rb-glow, #22d3ee) 70%, transparent);
  outline-offset: 1px;
}

.rb-screen-pin--selected .rb-screen-pin__glyph::after {
  background: var(--rb-cta, #e9601a);
}

.rb-screen-pin__label {
  position: absolute;
  top: -16px;
  padding: 1px 6px;
  border-radius: 9999px;
  background: #fff;
  color: #0f172a;
  font: 700 10px/14px var(--rb-font-body, system-ui, sans-serif);
  white-space: nowrap;
  box-shadow: 0 1px 4px rgba(2, 48, 92, 0.25);
}

.rb-screen-cluster {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: var(--primary, #0b6bcb);
  color: #fff;
  border: 3px solid #fff;
  box-shadow: 0 4px 12px rgba(2, 48, 92, 0.35);
  font: 700 13px/1 var(--rb-font-body, system-ui, sans-serif);
}

.rb-screen-cluster--selected {
  background: var(--rb-cta, #e9601a);
}
</style>

<style scoped>
.map-page-search {
  top: calc(var(--app-header-offset) + 4.5rem);
}

.map-layer-tabs {
  display: flex;
  padding: 3px;
  border-radius: 9999px;
  border: 1px solid color-mix(in oklab, var(--border) 60%, transparent);
  background: color-mix(in oklab, var(--card) 95%, transparent);
  box-shadow: var(--rb-elev-1);
  backdrop-filter: blur(12px);
}

.map-layer-tab {
  position: relative;
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 36px;
  border: 0;
  border-radius: 9999px;
  background: transparent;
  font-size: 13px;
  font-weight: 700;
  color: var(--muted-foreground);
}

.map-layer-tab.is-active {
  background: var(--primary);
  color: #fff;
}

.map-layer-tab__badge {
  display: inline-grid;
  place-items: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9999px;
  background: var(--rb-cta);
  color: #fff;
  font-size: 10px;
}

.map-category-option {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 0.75rem;
  border-radius: 1rem;
  border: 1px solid transparent;
  background: var(--secondary);
  padding: 0.875rem 1rem;
  text-align: left;
  color: var(--foreground);
}

.map-category-option--active {
  border-color: color-mix(in oklab, var(--primary) 25%, transparent);
  background: color-mix(in oklab, var(--primary) 8%, var(--card));
  color: var(--primary);
}

.agent-card-enter-active {
  transition: transform 0.32s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.32s ease;
}
.agent-card-leave-active {
  transition: transform 0.2s ease-in, opacity 0.2s ease;
}
.agent-card-enter-from,
.agent-card-leave-to {
  transform: translateY(130%);
  opacity: 0;
}
</style>
