<script setup lang="ts">
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { Loader2, LocateFixed, MapPin } from '@lucide/vue'
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps<{
  lat: number | null
  lng: number | null
}>()

const emit = defineEmits<{
  change: [value: { lat: number; lng: number; address: string | null }]
}>()

/** Default centre — Tashkent. */
const DEFAULT_CENTER: L.LatLngTuple = [41.311081, 69.279716]

/** Teardrop pin as an inline-SVG div icon — avoids Leaflet's bundler image issues. */
const PIN_ICON = L.divIcon({
  className: 'location-pin',
  html: `<svg width="30" height="30" viewBox="0 0 24 24" fill="var(--primary, #7c3aed)" stroke="white" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg"><path d="M12 21s-6-5.686-6-10a6 6 0 1 1 12 0c0 4.314-6 10-6 10z"/><circle cx="12" cy="11" r="2.2" fill="white" stroke="none"/></svg>`,
  iconSize: [30, 30],
  iconAnchor: [15, 28],
})

const mapEl = ref<HTMLElement | null>(null)
const status = ref<'loading' | 'ready' | 'error'>('loading')
const errorMsg = ref<string | null>(null)
const locating = ref(false)

let map: L.Map | null = null
let marker: L.Marker | null = null

async function reverseGeocode(lat: number, lng: number) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=0`,
      { headers: { 'Accept-Language': 'uz,ru,en' } },
    )
    const data = await res.json()
    emit('change', { lat, lng, address: data?.display_name ?? null })
  }
  catch {
    emit('change', { lat, lng, address: null })
  }
}

function placeMarker(lat: number, lng: number, pan = true) {
  if (!map) return

  if (!marker) {
    marker = L.marker([lat, lng], { icon: PIN_ICON, draggable: true }).addTo(map)
    marker.on('dragend', () => {
      const pos = marker!.getLatLng()
      reverseGeocode(pos.lat, pos.lng)
    })
  }
  else {
    marker.setLatLng([lat, lng])
  }

  if (pan) map.panTo([lat, lng])
}

function detectLocation() {
  if (!navigator.geolocation) {
    errorMsg.value = 'Geolocation is not available.'
    return
  }

  locating.value = true
  errorMsg.value = null

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = Number(position.coords.latitude.toFixed(7))
      const lng = Number(position.coords.longitude.toFixed(7))
      map?.setView([lat, lng], 16)
      placeMarker(lat, lng, false)
      reverseGeocode(lat, lng)
      locating.value = false
    },
    () => {
      errorMsg.value = 'Could not get your location.'
      locating.value = false
    },
    { enableHighAccuracy: true, timeout: 10000 },
  )
}

onMounted(() => {
  if (!mapEl.value) {
    status.value = 'error'
    errorMsg.value = 'Map container is unavailable.'
    return
  }

  try {
    const hasPoint = props.lat !== null && props.lng !== null
    const center: L.LatLngTuple = hasPoint ? [props.lat!, props.lng!] : DEFAULT_CENTER

    map = L.map(mapEl.value, { zoomControl: true, attributionControl: true })
      .setView(center, hasPoint ? 15 : 12)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(map)

    if (hasPoint) placeMarker(props.lat!, props.lng!, false)

    map.on('click', (event: L.LeafletMouseEvent) => {
      placeMarker(event.latlng.lat, event.latlng.lng)
      reverseGeocode(event.latlng.lat, event.latlng.lng)
    })

    // The container may have been laid out after init (inside a card) — recalc size.
    requestAnimationFrame(() => map?.invalidateSize())
    status.value = 'ready'
  }
  catch (e) {
    status.value = 'error'
    errorMsg.value = e instanceof Error ? e.message : 'Failed to load the map.'
  }
})

onBeforeUnmount(() => {
  map?.remove()
  map = null
  marker = null
})
</script>

<template>
  <div class="space-y-2">
    <div class="relative overflow-hidden rounded-2xl border border-white/40 dark:border-white/10">
      <div ref="mapEl" class="h-52 w-full bg-white/40 dark:bg-white/5" />

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
        <p class="text-xs text-muted-foreground">{{ errorMsg }}</p>
      </div>
    </div>

    <div class="flex items-center justify-between gap-2">
      <p v-if="status === 'ready'" class="text-xs text-muted-foreground">
        Tap the map or drag the pin.
      </p>
      <button
        type="button"
        class="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"
        @click="detectLocation"
      >
        <Loader2 v-if="locating" class="size-3.5 animate-spin" />
        <LocateFixed v-else class="size-3.5" />
        Use my location
      </button>
    </div>

    <p v-if="errorMsg && status === 'ready'" class="text-xs text-destructive">
      {{ errorMsg }}
    </p>
  </div>
</template>
