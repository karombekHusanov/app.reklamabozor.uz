<script setup lang="ts">
import { Calculator, List, Minus, Plus, X } from '@lucide/vue'
import { computed } from 'vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { categoryName } from '@/core/i18n/category-name'
import { useTelegram } from '@/core/composables/useTelegram'
import { usePlacementSelectionStore } from '@/modules/placements/stores/placement-selection.store'
import type { AdFormat, MetroLineData, MetroStation } from '@/modules/placements/types/placement'

/**
 * Bottom card for a metro line (or a station on it) tapped on the map: the
 * per-unit formats the operator sells on that line, each addable to the
 * calculator. Inventory is known per line, not per station — the card says so.
 */
const props = defineProps<{
  line: MetroLineData
  /** The tapped station, when the client tapped one rather than the line. */
  station: MetroStation | null
  formats: AdFormat[]
}>()

const emit = defineEmits<{ close: [], catalogue: [], calculate: [] }>()

const locale = useLocaleStore()
const selection = usePlacementSelectionStore()
const { haptic } = useTelegram()

const t = computed(() => locale.t.placements.metro)
const lineName = computed(() => t.value.lineTitle.replace('{line}', t.value.lines[props.line.code]))
const stationName = computed(() => (props.station ? (locale.locale === 'ru' ? props.station.name_ru : props.station.name_uz) : null))

/** Unit formats present on this line; network packages live in the catalogue. */
const lineFormats = computed(() => props.formats.filter(f => !f.is_package && (f.line_counts[props.line.code] ?? 0) > 0))

const money = (som: number) => new Intl.NumberFormat('uz-UZ').format(som)

function priceLine(format: AdFormat) {
  if (format.min_month_price_som === null) return ''
  const template = format.rates.length > 1 ? t.value.perMonthFrom : t.value.perMonth
  return template.replace('{price}', money(format.min_month_price_som))
}

function setQuantity(format: AdFormat, quantity: number) {
  haptic(quantity > selection.formatQuantity(format.id) ? 'medium' : 'light')
  selection.setFormat(format, quantity)
}
</script>

<template>
  <div class="relative flex max-h-[62vh] flex-col rounded-3xl bg-white p-4 shadow-2xl shadow-[#02305C]/35">
    <button
      type="button"
      class="absolute right-2.5 top-2.5 z-10 flex size-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition active:scale-90"
      :aria-label="locale.t.common.cancel"
      @click.stop="emit('close')"
    >
      <X class="size-4" />
    </button>

    <div class="flex items-center gap-3 pr-10">
      <span
        class="size-3.5 shrink-0 rounded-full"
        :style="{ background: `var(--rb-metro-${line.code})` }"
        aria-hidden="true"
      />
      <div class="min-w-0">
        <p class="truncate text-[16px] font-bold leading-snug text-slate-900">
          {{ stationName ?? lineName }}
        </p>
        <p class="truncate text-xs text-slate-600">
          <template v-if="stationName">
            {{ lineName }} ·
          </template>{{ t.stationsCount.replace('{n}', String(line.stations.length)) }}
        </p>
      </div>
    </div>

    <p class="mt-2 text-[11.5px] leading-snug text-slate-500">
      {{ t.lineNote }}
    </p>

    <ul
      v-if="lineFormats.length"
      class="-mx-1 mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto px-1"
    >
      <li
        v-for="format in lineFormats"
        :key="format.id"
        class="flex items-center gap-3 rounded-2xl bg-slate-50 px-3.5 py-3"
      >
        <div class="min-w-0 flex-1">
          <p class="line-clamp-2 text-sm font-bold leading-snug text-slate-900">
            {{ categoryName(format, locale.locale) }}
          </p>
          <p class="truncate text-xs text-slate-600">
            {{ priceLine(format) }}
          </p>
          <p class="truncate text-[11px] text-slate-500">
            {{ format.medium === 'digital' ? t.digital : t.static }} · {{ t.onLine.replace('{n}', String(format.line_counts[line.code])) }}
          </p>
        </div>

        <div
          v-if="selection.formatQuantity(format.id) > 0"
          class="flex shrink-0 items-center gap-1"
        >
          <button
            type="button"
            class="mls-step"
            :aria-label="t.remove"
            @click="setQuantity(format, selection.formatQuantity(format.id) - 1)"
          >
            <Minus class="size-4" />
          </button>
          <span
            class="w-7 text-center text-sm font-extrabold tabular-nums text-slate-900"
            aria-live="polite"
          >{{ selection.formatQuantity(format.id) }}</span>
          <button
            type="button"
            class="mls-step"
            :aria-label="t.add"
            :disabled="selection.formatQuantity(format.id) >= format.total_count"
            @click="setQuantity(format, selection.formatQuantity(format.id) + 1)"
          >
            <Plus class="size-4" />
          </button>
        </div>
        <button
          v-else
          type="button"
          class="flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground active:opacity-80"
          @click="setQuantity(format, 1)"
        >
          <Plus class="size-4" />
          {{ t.add }}
        </button>
      </li>
    </ul>
    <p
      v-else
      class="mt-3 rounded-2xl bg-slate-50 px-3.5 py-3 text-sm text-slate-600"
    >
      {{ t.noFormats }}
    </p>

    <div class="mt-3 flex gap-2">
      <button
        type="button"
        class="flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-slate-100 px-4 text-sm font-semibold text-slate-900 active:opacity-80"
        @click="emit('catalogue')"
      >
        <List class="size-4 shrink-0" />
        <span class="truncate">{{ t.allFormats }}</span>
      </button>
      <button
        v-if="selection.formatCount"
        type="button"
        class="btn-brand flex h-12 shrink-0 items-center gap-2 rounded-full px-5 text-sm font-bold"
        @click="emit('calculate')"
      >
        <Calculator class="size-4" />
        {{ t.calculate }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.mls-step {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 9999px;
  background: #fff;
  color: var(--foreground);
  box-shadow: var(--rb-elev-1);
}
.mls-step:disabled { opacity: 0.4; }
.mls-step:active:not(:disabled) { transform: scale(0.95); }
.mls-step:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
</style>
