<script setup lang="ts">
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { BadgeCheck, Check, ChevronRight, List, LocateFixed, MapPin, Search, Star, X } from '@lucide/vue'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Avatar from '@/core/ui/Avatar.vue'
import Drawer from '@/core/ui/Drawer.vue'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import { useTelegram } from '@/core/composables/useTelegram'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { categoryName } from '@/core/i18n/category-name'
import { useToast } from '@/core/composables/useToast'
import { getUserLocation, hasLocationAccess, warmupLocationManager } from '@/core/lib/user-location'
import { isInsideTelegram, supportsVersion } from '@/core/lib/telegram-init'
import { fetchTopAgents, type PublicAgent } from '@/modules/marketplace/services/agents.service'
import { fetchCategories } from '@/modules/orders/services/orders.service'
import type { Category } from '@/modules/agent/types/agent'

const locale = useLocaleStore()
const router = useRouter()
const toast = useToast()
const { haptic, WebApp } = useTelegram()

const selectedAgent = ref<PublicAgent | null>(null)

const selectedRating = computed(() =>
  selectedAgent.value ? (4.5 + (selectedAgent.value.completion_percent / 100) * 0.5).toFixed(1) : '',
)
const selectedCategory = computed(() =>
  selectedAgent.value?.categories[0] ? categoryName(selectedAgent.value.categories[0], locale.locale) : '',
)

function selectAgent(agent: PublicAgent) {
  haptic('light')
  selectedAgent.value = agent
  map?.panTo([Number(agent.lat), Number(agent.lng)], { animate: true })
}

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

const agents = ref<PublicAgent[]>([])
/** Full agent-type catalog — not derived from loaded markers. */
const categories = ref<Category[]>([])
const query = ref('')
const activeCategory = ref<number | null>(null)
const locating = ref(false)
const categoryDrawerOpen = ref(false)

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

function renderMarkers() {
  if (!map || !markerLayer) return
  markerLayer.clearLayers()
  for (const a of filteredAgents.value) {
    L.marker([Number(a.lat), Number(a.lng)], { icon: PIN })
      .on('click', () => selectAgent(a))
      .addTo(markerLayer)
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

  map.on('click', () => { selectedAgent.value = null })

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
  renderMarkers()
  if (selectedAgent.value && !list.some(a => a.id === selectedAgent.value!.id)) {
    selectedAgent.value = null
  }
})

onBeforeUnmount(() => {
  map?.remove()
  map = null
  markerLayer = null
  userLocationLayer = null
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
      :subtitle="locale.t.map.subtitle"
      show-back
    />

    <div class="map-page-search pointer-events-none fixed inset-x-0 z-[45] px-4">
      <div class="pointer-events-auto flex h-11 items-center gap-2.5 rounded-2xl border border-border/60 bg-card/95 px-3.5 shadow-sm backdrop-blur-md">
        <Search class="size-4 shrink-0 text-muted-foreground" />
        <input
          v-model="query"
          type="search"
          :placeholder="locale.t.map.searchPlaceholder"
          class="w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
        >
      </div>
    </div>

    <button
      type="button"
      class="absolute right-4 z-[70] flex size-13 items-center justify-center rounded-full bg-primary text-white shadow-xl shadow-[#02305C]/40 transition-all active:scale-95"
      :class="selectedAgent ? 'bottom-44' : 'bottom-28'"
      @click="centerOnUser"
    >
      <LocateFixed
        class="size-5"
        :class="locating && 'animate-pulse'"
      />
    </button>

    <div
      v-if="!selectedAgent"
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
              <p
                v-if="selectedAgent.location_label"
                class="mt-1 flex items-center gap-1 text-xs text-slate-500"
              >
                <MapPin class="size-3.5 shrink-0" />
                <span class="truncate">{{ selectedAgent.location_label }}</span>
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
</style>

<style scoped>
.map-page-search {
  top: calc(var(--app-header-offset) + 0.5rem);
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
