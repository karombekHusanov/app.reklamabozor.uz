<script setup lang="ts">
import { ChevronLeft, ChevronRight, MapPinned } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import Drawer from '@/core/ui/Drawer.vue'
import { regionName } from '@/core/i18n/region-name'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { useTelegram } from '@/core/composables/useTelegram'
import { cn } from '@/core/lib/utils'
import type { Region, RegionDistrict } from '@/modules/orders/types/region'

const props = defineProps<{
  regions: Region[]
}>()

const regionId = defineModel<number | null>('regionId', { default: null })
const districtId = defineModel<number | null>('districtId', { default: null })

const locale = useLocaleStore()
const { haptic } = useTelegram()

const open = ref(false)
/** When set, drawer shows this region's districts instead of the region list. */
const drillRegion = ref<Region | null>(null)

watch(open, (isOpen) => {
  if (!isOpen) {
    drillRegion.value = null
    return
  }
  // Re-open into the district list when a Tashkent district is already selected.
  const selected = props.regions.find(r => r.id === regionId.value) ?? null
  drillRegion.value = selected && selected.districts.length > 0 && districtId.value != null
    ? selected
    : null
})

const selectedRegion = computed(() =>
  props.regions.find(r => r.id === regionId.value) ?? null,
)

const selectedDistrict = computed(() => {
  const region = selectedRegion.value
  if (!region || districtId.value == null) return null
  return region.districts.find(d => d.id === districtId.value) ?? null
})

const selectedLabel = computed(() => {
  if (!selectedRegion.value) return ''
  const regionLabel = regionName(selectedRegion.value, locale.locale)
  if (selectedDistrict.value) {
    return `${regionName(selectedDistrict.value, locale.locale)}, ${regionLabel}`
  }
  return regionLabel
})

const drawerTitle = computed(() => {
  if (drillRegion.value) {
    return regionName(drillRegion.value, locale.locale)
  }
  return locale.t.orders.wizard.pickRegionTitle
})

function pickAll() {
  haptic('light')
  regionId.value = null
  districtId.value = null
  open.value = false
}

function pickRegion(region: Region) {
  haptic('light')
  if (region.districts.length > 0) {
    drillRegion.value = region
    return
  }
  regionId.value = region.id
  districtId.value = null
  open.value = false
}

function pickWholeRegion() {
  const parent = drillRegion.value
  if (!parent) return
  haptic('light')
  regionId.value = parent.id
  districtId.value = null
  open.value = false
}

function pickDistrict(district: RegionDistrict) {
  const parent = drillRegion.value
  if (!parent) return
  haptic('light')
  regionId.value = parent.id
  districtId.value = district.id
  open.value = false
}

function goBackToRegions() {
  haptic('light')
  drillRegion.value = null
}

function isRegionSelected(region: Region) {
  return regionId.value === region.id && (region.districts.length === 0 || districtId.value == null)
}

function isWholeRegionSelected() {
  const parent = drillRegion.value
  return parent != null && regionId.value === parent.id && districtId.value == null
}

function isDistrictSelected(district: RegionDistrict) {
  return districtId.value === district.id
}

const wholeRegionLabel = computed(() => {
  const parent = drillRegion.value
  if (!parent) return ''
  return locale.t.orders.wizard.regionWholeCity.replace(
    '{name}',
    regionName(parent, locale.locale),
  )
})
</script>

<template>
  <div>
    <button
      type="button"
      class="glass-input flex w-full items-center gap-3 text-left"
      :class="!selectedLabel && 'text-muted-foreground'"
      :data-state="open ? 'open' : 'closed'"
      @click="open = true"
    >
      <MapPinned class="size-5 shrink-0 text-muted-foreground" />
      <span class="grow">
        {{ selectedLabel || locale.t.orders.wizard.allUzbekistan }}
      </span>
      <ChevronRight class="size-4 shrink-0 text-muted-foreground" />
    </button>

    <Drawer
      v-model:open="open"
      :title="drawerTitle"
    >
      <!-- District drill-down -->
      <template v-if="drillRegion">
        <button
          type="button"
          class="mb-3 flex items-center gap-1.5 text-sm font-medium text-primary"
          @click="goBackToRegions"
        >
          <ChevronLeft class="size-4" />
          {{ locale.t.orders.wizard.backToRegions }}
        </button>

        <div class="space-y-1.5 pb-2">
          <button
            type="button"
            :class="cn(
              'glass-chip flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium transition active:scale-[0.98]',
              isWholeRegionSelected() && 'ring-2 ring-primary/50',
            )"
            @click="pickWholeRegion"
          >
            <span>{{ wholeRegionLabel }}</span>
          </button>

          <button
            v-for="district in drillRegion.districts"
            :key="district.id"
            type="button"
            :class="cn(
              'glass-chip flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium transition active:scale-[0.98]',
              isDistrictSelected(district) && 'ring-2 ring-primary/50',
            )"
            @click="pickDistrict(district)"
          >
            <span>{{ regionName(district, locale.locale) }}</span>
            <ChevronRight
              v-if="!isDistrictSelected(district)"
              class="size-4 shrink-0 text-muted-foreground"
            />
          </button>
        </div>
      </template>

      <!-- Region list -->
      <template v-else>
        <button
          type="button"
          :class="cn(
            'glass-chip mb-3 flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium transition active:scale-[0.98]',
            regionId == null && 'ring-2 ring-primary/50',
          )"
          @click="pickAll"
        >
          <span>{{ locale.t.orders.wizard.allUzbekistan }}</span>
        </button>

        <div class="space-y-1.5 pb-2">
          <button
            v-for="region in regions"
            :key="region.id"
            type="button"
            :class="cn(
              'glass-chip flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium transition active:scale-[0.98]',
              isRegionSelected(region) && 'ring-2 ring-primary/50',
            )"
            @click="pickRegion(region)"
          >
            <span>{{ regionName(region, locale.locale) }}</span>
            <ChevronRight class="size-4 shrink-0 text-muted-foreground" />
          </button>
        </div>
      </template>
    </Drawer>
  </div>
</template>
