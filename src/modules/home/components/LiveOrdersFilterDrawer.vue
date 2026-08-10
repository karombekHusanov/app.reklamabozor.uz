<script setup lang="ts">
import { Check, ChevronLeft, ChevronRight, X } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/core/ui/drawer'
import { Button } from '@/core/ui/button'
import { Checkbox } from '@/core/ui/checkbox'
import { categoryName } from '@/core/i18n/category-name'
import { regionName } from '@/core/i18n/region-name'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { useTelegram } from '@/core/composables/useTelegram'
import type {
  LiveOrdersDatePreset,
  LiveOrdersFilterState,
} from '@/modules/home/lib/live-orders-filters'
import type { Category } from '@/modules/agent/types/agent'
import type { Region, RegionDistrict } from '@/modules/orders/types/region'

const props = defineProps<{
  categories: Category[]
  regions: Region[]
  modelValue: LiveOrdersFilterState
}>()

const emit = defineEmits<{
  'update:modelValue': [value: LiveOrdersFilterState]
}>()

const open = defineModel<boolean>('open', { default: false })

const locale = useLocaleStore()
const { haptic } = useTelegram()

const draftCategoryIds = ref<number[]>([])
const draftRegionId = ref<number | null>(null)
const draftDistrictId = ref<number | null>(null)
const draftDatePreset = ref<LiveOrdersDatePreset>('all')
/** When set, region section shows this region's districts. */
const drillRegion = ref<Region | null>(null)

watch(open, (isOpen) => {
  if (!isOpen) {
    drillRegion.value = null
    return
  }
  draftCategoryIds.value = [...props.modelValue.categoryIds]
  draftRegionId.value = props.modelValue.regionId
  draftDistrictId.value = props.modelValue.districtId
  draftDatePreset.value = props.modelValue.datePreset

  const selected = props.regions.find(r => r.id === draftRegionId.value) ?? null
  drillRegion.value = selected && selected.districts.length > 0 && draftDistrictId.value != null
    ? selected
    : null
})

const categoryOptions = computed(() =>
  props.categories.map(category => ({
    id: category.id,
    name: categoryName(category, locale.locale),
  })),
)

const dateOptions = computed(() => [
  { id: 'all' as const, label: locale.t.home.liveOrdersFilterDateAll },
  { id: 'today' as const, label: locale.t.home.liveOrdersFilterDateToday },
  { id: 'week' as const, label: locale.t.home.liveOrdersFilterDateWeek },
  { id: 'month' as const, label: locale.t.home.liveOrdersFilterDateMonth },
])

const selectedRegion = computed(() =>
  props.regions.find(r => r.id === draftRegionId.value) ?? null,
)

const selectedDistrict = computed(() => {
  const region = selectedRegion.value
  if (!region || draftDistrictId.value == null) return null
  return region.districts.find(d => d.id === draftDistrictId.value) ?? null
})

const selectedRegionLabel = computed(() => {
  if (!selectedRegion.value) return locale.t.orders.wizard.allUzbekistan
  const regionLabel = regionName(selectedRegion.value, locale.locale)
  if (selectedDistrict.value) {
    return `${regionName(selectedDistrict.value, locale.locale)}, ${regionLabel}`
  }
  return regionLabel
})

const wholeRegionLabel = computed(() => {
  const parent = drillRegion.value
  if (!parent) return ''
  return locale.t.orders.wizard.regionWholeCity.replace(
    '{name}',
    regionName(parent, locale.locale),
  )
})

function isCategorySelected(id: number) {
  return draftCategoryIds.value.includes(id)
}

function setCategoryChecked(id: number, checked: boolean | 'indeterminate') {
  haptic('light')
  if (checked === true) {
    if (!draftCategoryIds.value.includes(id)) {
      draftCategoryIds.value = [...draftCategoryIds.value, id]
    }
    return
  }
  draftCategoryIds.value = draftCategoryIds.value.filter(categoryId => categoryId !== id)
}

function clearCategories() {
  haptic('light')
  draftCategoryIds.value = []
}

function onAllCategoriesChecked(checked: boolean | 'indeterminate') {
  if (checked === true) clearCategories()
}

function onRegionChecked(checked: boolean | 'indeterminate', action: () => void) {
  if (checked === true) action()
}

function pickDate(preset: LiveOrdersDatePreset) {
  haptic('light')
  draftDatePreset.value = preset
}

function pickAllRegions() {
  haptic('light')
  draftRegionId.value = null
  draftDistrictId.value = null
  drillRegion.value = null
}

function openRegionDrill(region: Region) {
  haptic('light')
  if (region.districts.length > 0) {
    drillRegion.value = region
    return
  }
  draftRegionId.value = region.id
  draftDistrictId.value = null
}

function pickWholeRegion() {
  const parent = drillRegion.value
  if (!parent) return
  haptic('light')
  draftRegionId.value = parent.id
  draftDistrictId.value = null
}

function pickDistrict(district: RegionDistrict) {
  const parent = drillRegion.value
  if (!parent) return
  haptic('light')
  draftRegionId.value = parent.id
  draftDistrictId.value = district.id
}

function goBackToRegions() {
  haptic('light')
  drillRegion.value = null
}

function isRegionSelected(region: Region) {
  return draftRegionId.value === region.id
    && (region.districts.length === 0 || draftDistrictId.value == null)
}

function isWholeRegionSelected() {
  const parent = drillRegion.value
  return parent != null && draftRegionId.value === parent.id && draftDistrictId.value == null
}

function isDistrictSelected(district: RegionDistrict) {
  return draftDistrictId.value === district.id
}

function apply() {
  haptic('medium')
  emit('update:modelValue', {
    categoryIds: [...draftCategoryIds.value],
    regionId: draftRegionId.value,
    districtId: draftDistrictId.value,
    datePreset: draftDatePreset.value,
  })
  open.value = false
}

function reset() {
  haptic('light')
  draftCategoryIds.value = []
  draftRegionId.value = null
  draftDistrictId.value = null
  draftDatePreset.value = 'all'
  drillRegion.value = null
  emit('update:modelValue', {
    categoryIds: [],
    regionId: null,
    districtId: null,
    datePreset: 'all',
  })
  open.value = false
}
</script>

<template>
  <Drawer v-model:open="open">
    <DrawerContent
      class="z-[100] max-h-[85vh] rounded-t-[28px] border-border/60 bg-card pb-[max(0.5rem,env(safe-area-inset-bottom))] dark:bg-[#0c1f36]"
    >
      <DrawerHeader class="shrink-0 flex-row items-center justify-between gap-3 px-5 pb-2 pt-1 text-left">
        <DrawerTitle class="text-base font-bold leading-tight">
          {{ locale.t.home.liveOrdersFilterTitle }}
        </DrawerTitle>
        <DrawerDescription class="sr-only">
          {{ locale.t.home.liveOrdersFilterTitle }}
        </DrawerDescription>
        <DrawerClose
          class="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition active:scale-95 dark:bg-white/10"
        >
          <X class="size-4" />
        </DrawerClose>
      </DrawerHeader>

      <div class="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 pb-3">
        <section class="space-y-2">
          <h3 class="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {{ locale.t.home.liveOrdersFilterCategory }}
          </h3>
          <div class="space-y-2">
            <div
              class="live-orders-filter-region pressable"
              :class="draftCategoryIds.length === 0 && 'live-orders-filter-region--selected'"
              @click="clearCategories"
            >
              <Checkbox
                :model-value="draftCategoryIds.length === 0"
                @click.stop
                @update:model-value="onAllCategoriesChecked"
              />
              <span class="live-orders-filter-region__label">
                {{ locale.t.home.liveOrdersFilterAll }}
              </span>
            </div>

            <div
              v-for="category in categoryOptions"
              :key="category.id"
              class="live-orders-filter-region pressable"
              :class="isCategorySelected(category.id) && 'live-orders-filter-region--selected'"
              @click="setCategoryChecked(category.id, !isCategorySelected(category.id))"
            >
              <Checkbox
                :model-value="isCategorySelected(category.id)"
                @click.stop
                @update:model-value="(value: boolean | 'indeterminate') => setCategoryChecked(category.id, value)"
              />
              <span class="live-orders-filter-region__label">
                {{ category.name }}
              </span>
            </div>
          </div>
        </section>

        <section class="space-y-2">
          <h3 class="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {{ locale.t.home.liveOrdersFilterDate }}
          </h3>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="option in dateOptions"
              :key="option.id"
              type="button"
              class="glass-chip rounded-2xl px-3.5 py-2 text-[11px] font-bold"
              :class="draftDatePreset === option.id ? 'border-primary/40 bg-primary/10 text-primary' : ''"
              @click="pickDate(option.id)"
            >
              {{ option.label }}
            </button>
          </div>
        </section>

        <section class="space-y-2">
          <div class="flex items-center justify-between gap-2">
            <h3 class="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              {{ locale.t.home.liveOrdersFilterRegion }}
            </h3>
            <span
              v-if="!drillRegion"
              class="truncate text-[11px] font-semibold text-primary"
            >
              {{ selectedRegionLabel }}
            </span>
          </div>

          <div
            v-if="drillRegion"
            class="space-y-2"
          >
            <button
              type="button"
              class="flex items-center gap-1.5 text-sm font-semibold text-primary"
              @click="goBackToRegions"
            >
              <ChevronLeft class="size-4" />
              {{ locale.t.orders.wizard.backToRegions }}
            </button>

            <button
              type="button"
              class="live-orders-filter-region pressable"
              :class="isWholeRegionSelected() && 'live-orders-filter-region--selected'"
              @click="pickWholeRegion"
            >
              <Checkbox
                :model-value="isWholeRegionSelected()"
                @click.stop
                @update:model-value="(value: boolean | 'indeterminate') => onRegionChecked(value, pickWholeRegion)"
              />
              <span class="live-orders-filter-region__label">
                {{ wholeRegionLabel }}
              </span>
            </button>

            <button
              v-for="district in drillRegion.districts"
              :key="district.id"
              type="button"
              class="live-orders-filter-region pressable"
              :class="isDistrictSelected(district) && 'live-orders-filter-region--selected'"
              @click="pickDistrict(district)"
            >
              <Checkbox
                :model-value="isDistrictSelected(district)"
                @click.stop
                @update:model-value="(value: boolean | 'indeterminate') => onRegionChecked(value, () => pickDistrict(district))"
              />
              <span class="live-orders-filter-region__label">
                {{ regionName(district, locale.locale) }}
              </span>
            </button>
          </div>

          <div
            v-else
            class="space-y-2"
          >
            <button
              type="button"
              class="live-orders-filter-region pressable"
              :class="draftRegionId == null && 'live-orders-filter-region--selected'"
              @click="pickAllRegions"
            >
              <Checkbox
                :model-value="draftRegionId == null"
                @click.stop
                @update:model-value="(value: boolean | 'indeterminate') => onRegionChecked(value, pickAllRegions)"
              />
              <span class="live-orders-filter-region__label">
                {{ locale.t.orders.wizard.allUzbekistan }}
              </span>
            </button>

            <button
              v-for="region in regions"
              :key="region.id"
              type="button"
              class="live-orders-filter-region pressable"
              :class="isRegionSelected(region) && 'live-orders-filter-region--selected'"
              @click="openRegionDrill(region)"
            >
              <Checkbox
                v-if="region.districts.length === 0"
                :model-value="isRegionSelected(region)"
                @click.stop
                @update:model-value="(value: boolean | 'indeterminate') => onRegionChecked(value, () => openRegionDrill(region))"
              />
              <span class="live-orders-filter-region__label">
                {{ regionName(region, locale.locale) }}
              </span>
              <ChevronRight
                v-if="region.districts.length > 0"
                class="size-4 shrink-0 text-muted-foreground"
              />
            </button>
          </div>
        </section>
      </div>

      <DrawerFooter class="shrink-0 flex-row gap-2 border-t border-border/60 bg-card px-4 pt-3 dark:bg-[#0c1f36]">
        <Button
          type="button"
          variant="outline"
          class="h-12 flex-1 rounded-2xl text-sm"
          @click="reset"
        >
          {{ locale.t.home.liveOrdersFilterReset }}
        </Button>
        <Button
          type="button"
          class="h-12 flex-1 rounded-2xl text-sm"
          @click="apply"
        >
          <Check class="size-4" />
          {{ locale.t.home.liveOrdersFilterApply }}
        </Button>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>
</template>
