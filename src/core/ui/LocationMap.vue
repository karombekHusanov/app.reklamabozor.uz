<script setup lang="ts">
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { ExternalLink, Loader2, MapPin } from '@lucide/vue'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { openInYandexMaps } from '@/core/lib/yandex-maps'

const props = defineProps<{
  lat: number | string | null | undefined
  lng: number | string | null | undefined
  label?: string | null
}>()

const locale = useLocaleStore()

const mapEl = ref<HTMLElement | null>(null)
const status = ref<'loading' | 'ready' | 'error'>('loading')
const errorMsg = ref<string | null>(null)

let map: L.Map | null = null

const PIN_ICON = L.divIcon({
  className: 'location-pin',
  html: `<svg width="30" height="30" viewBox="0 0 24 24" fill="var(--primary, #7c3aed)" stroke="white" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg"><path d="M12 21s-6-5.686-6-10a6 6 0 1 1 12 0c0 4.314-6 10-6 10z"/><circle cx="12" cy="11" r="2.2" fill="white" stroke="none"/></svg>`,
  iconSize: [30, 30],
  iconAnchor: [15, 28],
})

const coords = computed(() => {
  const lat = Number(props.lat)
  const lng = Number(props.lng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
  return { lat, lng }
})

function openYandex() {
  if (!coords.value) return
  openInYandexMaps(coords.value.lat, coords.value.lng, props.label)
}

function initMap() {
  if (!mapEl.value || !coords.value) {
    status.value = 'error'
    errorMsg.value = locale.t.ui.errMapContainer
    return
  }

  try {
    const { lat, lng } = coords.value
    map = L.map(mapEl.value, {
      zoomControl: false,
      attributionControl: true,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      touchZoom: false,
    }).setView([lat, lng], 15)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(map)

    L.marker([lat, lng], { icon: PIN_ICON, interactive: false }).addTo(map)

    requestAnimationFrame(() => map?.invalidateSize())
    status.value = 'ready'
  }
  catch (e) {
    status.value = 'error'
    errorMsg.value = e instanceof Error ? e.message : locale.t.ui.errMapLoad
  }
}

function destroyMap() {
  map?.remove()
  map = null
}

onMounted(() => {
  if (coords.value) initMap()
  else {
    status.value = 'error'
    errorMsg.value = locale.t.ui.errMapLoad
  }
})

watch(coords, (next) => {
  destroyMap()
  status.value = 'loading'
  if (next) {
    requestAnimationFrame(() => initMap())
  }
})

onBeforeUnmount(destroyMap)
</script>

<template>
  <div
    v-if="coords"
    class="space-y-2"
  >
    <div class="overflow-hidden z-0! rounded-2xl border border-border">
      <div
        ref="mapEl"
        class="h-44 w-full bg-muted/40 z-0!"
      >
        <div
          v-if="status === 'loading'"
          class="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/40 dark:bg-black/30"
        >
          <Loader2 class="size-5 animate-spin text-primary" />
        </div>

        <div
          v-else-if="status === 'error'"
          class="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-white/60 p-4 text-center dark:bg-black/40"
        >
          <MapPin class="size-5 text-muted-foreground" />
          <p class="text-xs text-muted-foreground">
            {{ errorMsg }}
          </p>
        </div>
      </div>
    </div>

    <button
      type="button"
      class="pressable inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card px-3 py-2.5 text-sm font-medium text-foreground transition active:scale-[0.98]"
      @click="openYandex"
    >
      <ExternalLink class="size-4 text-primary" />
      {{ locale.t.ui.openInYandexMaps }}
    </button>
  </div>
</template>
