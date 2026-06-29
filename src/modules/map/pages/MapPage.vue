<script setup lang="ts">
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { Bell, ChevronLeft, List, LocateFixed, Search } from '@lucide/vue'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { categoryName } from '@/core/i18n/category-name'
import { ROUTES } from '@/modules/shell/constants/routes'
import { fetchTopAgents, type PublicAgent } from '@/modules/marketplace/services/agents.service'

const locale = useLocaleStore()
const router = useRouter()

/** Default centre — Tashkent. */
const DEFAULT_CENTER: L.LatLngTuple = [41.311081, 69.279716]

const mapEl = ref<HTMLElement | null>(null)
let map: L.Map | null = null
let markerLayer: L.LayerGroup | null = null
let fitted = false

const agents = ref<PublicAgent[]>([])
const query = ref('')
const activeCategory = ref<number | null>(null)
const locating = ref(false)

/** Brand "B" teardrop pin (logo head + blue pointer) as a div icon. */
const PIN = L.divIcon({
  className: 'rb-pin',
  html: `<div style="display:flex;flex-direction:column;align-items:center">
    <img src="/images/logo.png" style="width:36px;height:36px;border-radius:9999px;box-shadow:0 4px 10px rgba(2,48,92,.45)" />
    <div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:11px solid #0386D9;margin-top:-3px;filter:drop-shadow(0 2px 1px rgba(2,48,92,.35))"></div>
  </div>`,
  iconSize: [36, 49],
  iconAnchor: [18, 47],
  popupAnchor: [0, -44],
})

// Category chips built from the categories the fetched agents serve.
const categories = computed(() => {
  const map2 = new Map<number, string>()
  agents.value.forEach(a => a.categories.forEach(c => map2.set(c.id, categoryName(c, locale.locale))))
  return [...map2.entries()].map(([id, name]) => ({ id, name }))
})

const filteredAgents = computed(() => {
  const q = query.value.trim().toLowerCase()
  return agents.value.filter((a) => {
    const lat = Number(a.lat)
    const lng = Number(a.lng)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false

    const matchCat = activeCategory.value === null || a.categories.some(c => c.id === activeCategory.value)
    const matchQ = !q
      || a.company_name.toLowerCase().includes(q)
      || (a.location_label?.toLowerCase().includes(q) ?? false)
    return matchCat && matchQ
  })
})

function renderMarkers() {
  if (!map || !markerLayer) return
  markerLayer.clearLayers()
  for (const a of filteredAgents.value) {
    L.marker([Number(a.lat), Number(a.lng)], { icon: PIN })
      .bindPopup(`<strong>${a.company_name}</strong>`)
      .addTo(markerLayer)
  }
}

/** Frame all markers once after the first load. */
function maybeFit() {
  if (!map || fitted) return
  const list = filteredAgents.value
  if (list.length === 0) return
  const latlngs = list.map(a => [Number(a.lat), Number(a.lng)] as L.LatLngTuple)
  if (latlngs.length === 1) map.setView(latlngs[0], 14)
  else map.fitBounds(L.latLngBounds(latlngs).pad(0.25))
  fitted = true
}

function toggleCategory(id: number) {
  activeCategory.value = activeCategory.value === id ? null : id
}

function locate() {
  if (!navigator.geolocation || locating.value) return
  locating.value = true
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      map?.setView([pos.coords.latitude, pos.coords.longitude], 15)
      locating.value = false
    },
    () => { locating.value = false },
    { enableHighAccuracy: true, timeout: 10000 },
  )
}

async function load() {
  try {
    agents.value = await fetchTopAgents(50)
  }
  catch {
    agents.value = []
  }
}

onMounted(async () => {
  if (!mapEl.value) return

  map = L.map(mapEl.value, { zoomControl: false, attributionControl: true })
    .setView(DEFAULT_CENTER, 13)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
    maxZoom: 19,
  }).addTo(map)

  markerLayer = L.layerGroup().addTo(map)

  await nextTick()
  map.invalidateSize()

  await load()
  renderMarkers()
  maybeFit()
})

watch(filteredAgents, () => {
  renderMarkers()
  maybeFit()
})

onBeforeUnmount(() => {
  map?.remove()
  map = null
  markerLayer = null
})
</script>

<template>
  <div class="fixed inset-0 z-[60] bg-slate-200">
    <!-- z-0 confines Leaflet's internal panes to their own stacking context so the overlays sit above the map. -->
    <div ref="mapEl" class="absolute inset-0 z-0" />

    <!-- Top overlay: search + circular controls -->
    <div class="safe-top absolute inset-x-0 top-0 z-[70] px-4 pt-3">
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-[#02305C]/30 transition active:scale-95"
          @click="router.back()"
        >
          <ChevronLeft class="size-5" />
        </button>

        <div class="flex h-11 flex-1 items-center gap-2 rounded-full bg-white px-4 shadow-lg shadow-[#02305C]/20">
          <Search class="size-4 shrink-0 text-slate-400" />
          <input
            v-model="query"
            type="search"
            :placeholder="locale.t.map.searchPlaceholder"
            class="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
          >
        </div>

        <button
          type="button"
          class="relative flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-[#02305C]/30 transition active:scale-95"
        >
          <Bell class="size-5" />
          <span class="absolute right-2.5 top-2.5 size-2 rounded-full bg-red-500 ring-2 ring-primary" />
        </button>
      </div>

      <!-- Category filter chips -->
      <div
        v-if="categories.length"
        class="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <button
          v-for="category in categories"
          :key="category.id"
          type="button"
          class="flex max-w-32 shrink-0 items-center rounded-2xl px-4 py-2 text-xs font-bold uppercase leading-tight shadow-md transition"
          :class="activeCategory === category.id ? 'bg-white text-primary' : 'bg-primary text-white'"
          @click="toggleCategory(category.id)"
        >
          {{ category.name }}
        </button>
      </div>
    </div>

    <!-- Locate FAB -->
    <button
      type="button"
      class="absolute bottom-28 right-4 z-[70] flex size-13 items-center justify-center rounded-full bg-primary text-white shadow-xl shadow-[#02305C]/40 transition active:scale-95"
      @click="locate"
    >
      <LocateFixed class="size-5" :class="locating && 'animate-pulse'" />
    </button>

    <!-- List view pill -->
    <div class="safe-bottom absolute inset-x-0 bottom-0 z-[70] flex justify-center px-6 pb-4">
      <button
        type="button"
        class="btn-brand flex h-12 w-full max-w-xs items-center justify-center gap-2 rounded-full text-sm font-semibold"
        @click="router.push(ROUTES.marketplace)"
      >
        <List class="size-5" />
        {{ locale.t.map.listView }}
      </button>
    </div>
  </div>
</template>
