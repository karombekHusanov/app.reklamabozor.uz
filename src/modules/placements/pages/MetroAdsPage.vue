<script setup lang="ts">
import { Calculator, Check, Minus, Phone, Plus } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Skeleton from '@/core/ui/Skeleton.vue'
import { useTelegram } from '@/core/composables/useTelegram'
import { useToast } from '@/core/composables/useToast'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { categoryName } from '@/core/i18n/category-name'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import { ROUTES } from '@/modules/shell/constants/routes'
import { fetchAdFormats } from '@/modules/placements/services/placements.service'
import { usePlacementSelectionStore } from '@/modules/placements/stores/placement-selection.store'
import type { AdFormat, MetroLine } from '@/modules/placements/types/placement'

/**
 * Metro advertising catalogue: the operator's formats with one price each,
 * counts per line, and the network-wide packages. Metro inventory has no
 * street pin of its own, so it is a list (reached from the map's "Metro" tab)
 * that feeds the same calculator as the LED screens.
 */
type Filter = 'all' | 'digital' | 'static'
const LINES: MetroLine[] = ['chilonzor', 'ozbekiston', 'yunusobod', 'halqa']

const locale = useLocaleStore()
const router = useRouter()
const toast = useToast()
const selection = usePlacementSelectionStore()
const { haptic } = useTelegram()

const t = computed(() => locale.t.placements.metro)
const formats = ref<AdFormat[]>([])
const loading = ref(true)
const filter = ref<Filter>('all')

const visible = computed(() => formats.value.filter(f => filter.value === 'all' || f.medium === filter.value))
const packages = computed(() => visible.value.filter(f => f.is_package))
const units = computed(() => visible.value.filter(f => !f.is_package))
const operator = computed(() => formats.value[0]?.owner ?? null)

const money = (som: number) => new Intl.NumberFormat('uz-UZ').format(som)
const compact = (n: number) => new Intl.NumberFormat('uz-UZ', { notation: 'compact' }).format(n)

function priceLine(format: AdFormat) {
  if (format.min_month_price_som === null) return ''
  const template = format.rates.length > 1 ? t.value.perMonthFrom : t.value.perMonth
  return template.replace('{price}', money(format.min_month_price_som))
}

function specLine(format: AdFormat) {
  return [format.specs.size, format.specs.resolution ? `${format.specs.resolution} px` : null, format.specs.material]
    .filter(Boolean)
    .join(' · ')
}

function lineCounts(format: AdFormat) {
  return LINES.filter(line => (format.line_counts[line] ?? 0) > 0)
    .map(line => ({ line, count: format.line_counts[line]! }))
}

function setQuantity(format: AdFormat, quantity: number) {
  haptic(quantity > selection.formatQuantity(format.id) ? 'medium' : 'light')
  selection.setFormat(format, quantity)
}

function openCalculator() {
  haptic('medium')
  router.push(ROUTES.placementCalculator)
}

function call(phone: string) {
  haptic('light')
  // tel: must go through the browser — Telegram's openLink only takes http(s).
  window.location.href = `tel:${phone.replace(/[^+\d]/g, '')}`
}

onMounted(async () => {
  try {
    formats.value = await fetchAdFormats()
  }
  catch {
    toast.error(t.value.loadError)
  }
  finally {
    loading.value = false
  }
})
</script>

<template>
  <div :class="selection.formatCount ? 'pb-28' : 'pb-8'">
    <AppHeader
      :title="t.title"
      :subtitle="operator ? t.subtitle.replace('{owner}', operator.name).replace('{n}', String(formats.length)) : undefined"
      show-back
    />

    <div class="space-y-5 px-4">
      <div
        class="glass-segment grid grid-cols-3 gap-1 rounded-full p-1"
        role="tablist"
      >
        <button
          v-for="option in (['all', 'digital', 'static'] as Filter[])"
          :key="option"
          type="button"
          role="tab"
          class="metro-filter"
          :class="filter === option && 'is-active'"
          :aria-selected="filter === option"
          @click="filter = option"
        >
          {{ t[option] }}
        </button>
      </div>

      <div
        v-if="loading"
        class="space-y-3"
      >
        <Skeleton
          v-for="n in 4"
          :key="n"
          class="h-36 w-full rounded-3xl"
        />
      </div>

      <template v-else>
        <section
          v-for="group in [{ key: 'packages', list: packages }, { key: 'formats', list: units }]"
          v-show="group.list.length"
          :key="group.key"
        >
          <div class="mb-2.5 px-1">
            <h2 class="rb-sec__title">
              {{ group.key === 'packages' ? t.packages : t.formats }}
            </h2>
            <p class="mt-0.5 text-xs text-muted-foreground">
              {{ group.key === 'packages' ? t.packagesHint : t.stationsNote }}
            </p>
          </div>

          <ul class="space-y-3">
            <li
              v-for="format in group.list"
              :key="format.id"
              class="rb-card rb-card--lg p-4"
              :class="selection.formatQuantity(format.id) > 0 && 'is-picked'"
            >
              <div>
                <div class="min-w-0">
                  <p class="metro-kicker">
                    {{ format.medium === 'digital' ? t.digital : t.static }}
                    · {{ format.is_package ? t.packageOf.replace('{n}', String(format.total_count)) : t.count.replace('{n}', String(format.total_count)) }}
                  </p>
                  <h3 class="mt-1 text-[16px] font-bold leading-snug text-foreground">
                    {{ categoryName(format, locale.locale) }}
                  </h3>
                  <p
                    v-if="specLine(format)"
                    class="mt-0.5 text-xs text-muted-foreground"
                  >
                    {{ specLine(format) }}
                  </p>
                </div>
                <div class="mt-2 flex items-baseline gap-2">
                  <p class="metro-price">
                    {{ priceLine(format) }}
                  </p>
                  <p
                    v-if="!format.is_package"
                    class="text-xs text-muted-foreground"
                  >
                    {{ t.perUnit }}
                  </p>
                </div>
              </div>

              <ul
                class="mt-3 flex flex-wrap gap-x-3 gap-y-1.5"
                :aria-label="t.count.replace('{n}', String(format.total_count))"
              >
                <li
                  v-for="row in lineCounts(format)"
                  :key="row.line"
                  class="flex items-center gap-1.5 text-xs font-semibold text-foreground"
                >
                  <span
                    class="metro-dot"
                    :style="{ background: `var(--rb-metro-${row.line})` }"
                    aria-hidden="true"
                  />
                  {{ t.lines[row.line] }} <span class="text-muted-foreground">{{ row.count }}</span>
                </li>
              </ul>

              <div class="mt-3 flex flex-wrap gap-1.5">
                <span
                  v-if="format.slot_options.length"
                  class="rb-chip"
                >{{ t.clip.replace('{s}', format.slot_options.join(' / ')) }}</span>
                <span
                  v-if="format.min_months > 1"
                  class="rb-chip"
                >{{ t.minMonths.replace('{n}', String(format.min_months)) }}</span>
                <span
                  v-if="!format.production_included"
                  class="rb-chip"
                >{{ t.productionExtra }}</span>
                <span
                  v-if="format.daily_reach"
                  class="rb-chip"
                >{{ t.reach.replace('{n}', compact(format.daily_reach)) }}</span>
              </div>

              <div class="mt-3.5">
                <!-- Packages toggle; unit formats get a quantity stepper once added. -->
                <div
                  v-if="!format.is_package && selection.formatQuantity(format.id) > 0"
                  class="flex items-center justify-between gap-3"
                >
                  <span class="text-sm font-semibold text-foreground">{{ t.qtyLabel }}</span>
                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      class="metro-step"
                      :aria-label="t.remove"
                      @click="setQuantity(format, selection.formatQuantity(format.id) - 1)"
                    >
                      <Minus class="size-4" />
                    </button>
                    <span
                      class="w-10 text-center text-base font-extrabold tabular-nums text-foreground"
                      aria-live="polite"
                    >{{ selection.formatQuantity(format.id) }}</span>
                    <button
                      type="button"
                      class="metro-step"
                      :aria-label="t.add"
                      :disabled="selection.formatQuantity(format.id) >= format.total_count"
                      @click="setQuantity(format, selection.formatQuantity(format.id) + 1)"
                    >
                      <Plus class="size-4" />
                    </button>
                  </div>
                </div>
                <button
                  v-else
                  type="button"
                  class="flex h-11 w-full items-center justify-center gap-2 rounded-full text-sm font-bold transition active:scale-[0.98]"
                  :class="selection.formatQuantity(format.id) > 0 ? 'bg-foreground text-background' : 'bg-secondary text-foreground'"
                  :aria-pressed="selection.formatQuantity(format.id) > 0"
                  @click="setQuantity(format, selection.formatQuantity(format.id) > 0 ? 0 : 1)"
                >
                  <Check
                    v-if="selection.formatQuantity(format.id) > 0"
                    class="size-4"
                  />
                  <Plus
                    v-else
                    class="size-4"
                  />
                  {{ selection.formatQuantity(format.id) > 0 ? t.added : t.add }}
                </button>
              </div>
            </li>
          </ul>
        </section>

        <section
          v-if="operator"
          class="rb-card flex items-center justify-between gap-3 p-4"
        >
          <div class="min-w-0">
            <p class="metro-kicker">
              {{ t.operator }}
            </p>
            <p class="truncate text-[15px] font-bold text-foreground">
              {{ operator.name }}
            </p>
            <p
              v-if="operator.website"
              class="truncate text-xs text-muted-foreground"
            >
              {{ operator.website }}
            </p>
          </div>
          <button
            v-if="operator.phones[0]"
            type="button"
            class="flex h-11 shrink-0 items-center gap-2 rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground active:opacity-80"
            @click="call(operator.phones[0])"
          >
            <Phone class="size-4" />
            {{ operator.phones[0] }}
          </button>
        </section>
      </template>
    </div>

    <Transition name="metro-bar">
      <div
        v-if="selection.formatCount"
        class="safe-bottom fixed inset-x-0 bottom-0 z-30 px-4 pb-4"
      >
        <div class="rb-card flex items-center gap-3 rounded-3xl p-3 shadow-2xl">
          <p class="min-w-0 flex-1 truncate pl-1.5 text-[15px] font-bold text-foreground">
            {{ t.calcBar.replace('{n}', String(selection.formatCount)) }}
          </p>
          <button
            type="button"
            class="btn-brand flex h-11 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-bold"
            @click="openCalculator"
          >
            <Calculator class="size-4" />
            {{ t.calculate }}
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.metro-filter {
  min-height: 40px;
  border-radius: 9999px;
  font-size: 13.5px;
  font-weight: 700;
  color: var(--muted-foreground);
  transition: background var(--rb-dur) var(--rb-ease), color var(--rb-dur) var(--rb-ease);
}
.metro-filter.is-active {
  background: var(--primary);
  color: var(--primary-foreground);
}
.metro-filter:focus-visible,
.metro-step:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.metro-kicker {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--primary);
}
.metro-price {
  font-family: var(--rb-font-display);
  font-size: 17px;
  font-weight: 800;
  letter-spacing: -0.01em;
  font-variant-numeric: tabular-nums;
  color: var(--foreground);
  white-space: nowrap;
}
.metro-dot {
  width: 9px;
  height: 9px;
  border-radius: 9999px;
  flex-shrink: 0;
}
.metro-step {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 9999px;
  background: var(--secondary);
  color: var(--foreground);
}
.metro-step:disabled { opacity: 0.4; }
.metro-step:active:not(:disabled) { transform: scale(0.95); }

.is-picked { border-color: var(--primary); }

.metro-bar-enter-active,
.metro-bar-leave-active { transition: transform var(--rb-dur) var(--rb-ease), opacity var(--rb-dur) var(--rb-ease); }
.metro-bar-enter-from,
.metro-bar-leave-to { transform: translateY(12px); opacity: 0; }

@media (prefers-reduced-motion: reduce) {
  .metro-filter,
  .metro-bar-enter-active,
  .metro-bar-leave-active { transition: none; }
}
</style>
