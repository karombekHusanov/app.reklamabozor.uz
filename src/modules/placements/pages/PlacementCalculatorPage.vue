<script setup lang="ts">
import { Minus, Phone, Plus, X } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import EmptyState from '@/core/ui/EmptyState.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import { useTelegram } from '@/core/composables/useTelegram'
import { useToast } from '@/core/composables/useToast'
import { useLocaleStore } from '@/core/i18n/locale.store'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import { ROUTES } from '@/modules/shell/constants/routes'
import { estimatePlacements } from '@/modules/placements/services/placements.service'
import { usePlacementSelectionStore } from '@/modules/placements/stores/placement-selection.store'
import type { PlacementEstimate } from '@/modules/placements/types/placement'

/**
 * Price calculator for the screens picked on the map: clip length × term.
 * Owners quote by the month, so the monthly price is what is shown; days past
 * a whole month are pro-rated and nothing shorter than `min_days` is quoted.
 * The server owns the maths (owner's rate for the exact clip length, pro-rated
 * by days, VAT on top) — this page only collects the two inputs and renders
 * the breakdown. It is an estimate; the owner confirms the deal.
 */
const DEFAULT_SLOTS = [5, 10, 15, 20]
/** Owners sell by the month — presets are whole months, extra days are pro-rated. */
const MONTH_PRESETS = [1, 2, 3, 6]
const MONTH_DAYS = 30
const MAX_DAYS = 365

const locale = useLocaleStore()
const router = useRouter()
const toast = useToast()
const selection = usePlacementSelectionStore()
const { haptic } = useTelegram()

const t = computed(() => locale.t.placements.calc)

const slotOptions = computed(() => {
  const all = new Set<number>()
  for (const p of selection.items) for (const s of p.slot_options ?? []) all.add(s)
  return all.size ? [...all].sort((a, b) => a - b) : DEFAULT_SLOTS
})

const slotSeconds = ref(slotOptions.value.includes(10) ? 10 : slotOptions.value[0]!)
const days = ref(MONTH_DAYS)
/** Shortest booking the server quotes; refreshed from every estimate. */
const minDays = ref(MONTH_DAYS)
const estimate = ref<PlacementEstimate | null>(null)
const loading = ref(false)

const money = (som: number) => new Intl.NumberFormat('uz-UZ').format(som)

/** One owner with a phone → a direct "call" action under the total. */
const ownerPhone = computed(() => {
  const owners = new Set(selection.items.map(p => p.owner.name))
  return owners.size === 1 ? (selection.items[0]?.owner.phones[0] ?? null) : null
})

let requestSeq = 0
async function recalc() {
  if (selection.isEmpty) {
    estimate.value = null
    return
  }
  const seq = ++requestSeq
  loading.value = true
  try {
    const result = await estimatePlacements(selection.ids, days.value, slotSeconds.value)
    if (seq === requestSeq) {
      estimate.value = result
      minDays.value = result.min_days
    }
  }
  catch {
    if (seq === requestSeq) toast.error(t.value.error)
  }
  finally {
    if (seq === requestSeq) loading.value = false
  }
}

watch([() => selection.ids.join(','), days, slotSeconds], recalc, { immediate: true })

function setDays(next: number) {
  const clamped = Math.min(MAX_DAYS, Math.max(minDays.value, Math.round(next) || minDays.value))
  if (clamped !== days.value) haptic('light')
  days.value = clamped
}

function pickSlot(seconds: number) {
  if (seconds === slotSeconds.value) return
  haptic('light')
  slotSeconds.value = seconds
}

function remove(id: number) {
  haptic('light')
  selection.remove(id)
}

function toMap() {
  haptic('light')
  router.push({ path: ROUTES.map, query: { layer: 'screens' } })
}

function call(phone: string) {
  haptic('medium')
  // tel: must go through the browser — Telegram's openLink only takes http(s).
  window.location.href = `tel:${phone.replace(/[^+\d]/g, '')}`
}
</script>

<template>
  <div class="pb-8">
    <AppHeader
      :title="t.title"
      :subtitle="selection.isEmpty ? undefined : t.subtitle.replace('{n}', String(selection.count))"
      show-back
    />

    <div
      v-if="selection.isEmpty"
      class="px-4 pt-6"
    >
      <EmptyState
        :title="t.empty"
        :description="t.emptyHint"
      />
      <button
        type="button"
        class="btn-brand mx-auto mt-5 flex h-12 w-full max-w-xs items-center justify-center rounded-full text-sm font-bold"
        @click="toMap"
      >
        {{ t.toMap }}
      </button>
    </div>

    <div
      v-else
      class="space-y-4 px-4"
    >
      <!-- Inputs -->
      <section class="rb-card p-4">
        <div class="flex items-baseline justify-between gap-3">
          <h2 class="calc-label">
            {{ t.clipTitle }}
          </h2>
          <span class="text-xs text-muted-foreground">{{ t.clipHint }}</span>
        </div>
        <div
          class="mt-2.5 grid gap-2"
          :style="{ gridTemplateColumns: `repeat(${slotOptions.length}, minmax(0, 1fr))` }"
          role="radiogroup"
          :aria-label="t.clipTitle"
        >
          <button
            v-for="seconds in slotOptions"
            :key="seconds"
            type="button"
            role="radio"
            class="calc-option"
            :class="seconds === slotSeconds && 'is-active'"
            :aria-checked="seconds === slotSeconds"
            @click="pickSlot(seconds)"
          >
            {{ t.secUnit.replace('{n}', String(seconds)) }}
          </button>
        </div>

        <div class="mt-5 flex items-baseline justify-between gap-3">
          <h2 class="calc-label">
            {{ t.daysTitle }}
          </h2>
          <span class="text-xs text-muted-foreground">{{ t.daysHint.replace('{min}', String(minDays)) }}</span>
        </div>
        <div class="mt-2.5 flex items-center gap-3">
          <button
            type="button"
            class="calc-step"
            :aria-label="t.decDays"
            :disabled="days <= minDays"
            @click="setDays(days - 1)"
          >
            <Minus class="size-5" />
          </button>
          <label class="flex min-w-0 flex-1 items-baseline justify-center gap-1.5 rounded-2xl bg-secondary px-3 py-2.5">
            <input
              :value="days"
              type="number"
              inputmode="numeric"
              :min="minDays"
              :max="MAX_DAYS"
              class="calc-days w-16 bg-transparent text-right text-2xl font-extrabold text-foreground outline-none"
              :aria-label="t.daysTitle"
              @change="setDays(Number(($event.target as HTMLInputElement).value))"
            >
            <span class="text-sm font-semibold text-muted-foreground">{{ locale.t.placements.dayUnit }}</span>
          </label>
          <button
            type="button"
            class="calc-step"
            :aria-label="t.incDays"
            :disabled="days >= MAX_DAYS"
            @click="setDays(days + 1)"
          >
            <Plus class="size-5" />
          </button>
        </div>
        <div class="mt-2.5 flex flex-wrap gap-2">
          <button
            v-for="months in MONTH_PRESETS"
            :key="months"
            type="button"
            class="calc-preset"
            :class="months * MONTH_DAYS === days && 'is-active'"
            @click="setDays(months * MONTH_DAYS)"
          >
            {{ t.months.replace('{n}', String(months)) }}
          </button>
        </div>
      </section>

      <!-- Per-screen breakdown -->
      <section>
        <h2 class="calc-label mb-2 px-1">
          {{ t.screensTitle }}
        </h2>
        <div
          v-if="!estimate"
          class="space-y-2"
        >
          <Skeleton
            v-for="n in selection.count"
            :key="n"
            class="h-[4.5rem] w-full rounded-2xl"
          />
        </div>
        <ul
          v-else
          class="space-y-2"
          :class="loading && 'opacity-60'"
        >
          <li
            v-for="item in estimate.items"
            :key="item.placement_id"
            class="rb-card flex items-start gap-3 p-3.5"
          >
            <div class="min-w-0 flex-1">
              <p class="truncate text-[15px] font-bold text-foreground">
                {{ item.name ?? item.address }}
              </p>
              <p class="truncate text-xs text-muted-foreground">
                <template v-if="item.size">
                  {{ item.size }} m ·
                </template>{{ item.name ? item.address : item.owner_name }}
              </p>
              <p
                v-if="item.priced && item.rate"
                class="mt-1 text-xs text-muted-foreground"
              >
                {{ t.perMonth.replace('{price}', money(item.rate.price_som)) }}
              </p>
              <p
                v-else
                class="mt-1 text-xs font-semibold text-destructive"
              >
                {{ t.noRate }}
              </p>
            </div>
            <p
              v-if="item.price_som !== null"
              class="calc-num shrink-0 pt-0.5 text-right text-[15px] font-extrabold text-foreground"
            >
              {{ money(item.price_som) }}
            </p>
            <button
              type="button"
              class="-mr-1.5 -mt-1.5 grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground active:opacity-70"
              :aria-label="locale.t.placements.remove"
              @click="remove(item.placement_id)"
            >
              <X class="size-4" />
            </button>
          </li>
        </ul>
      </section>

      <!-- Total -->
      <section
        v-if="estimate"
        class="rb-card p-4"
        :class="loading && 'opacity-60'"
        aria-live="polite"
      >
        <div class="calc-row">
          <span>{{ t.subtotal }}</span>
          <span class="calc-num">{{ money(estimate.subtotal_som) }}</span>
        </div>
        <div class="calc-row mt-1.5">
          <span>{{ t.vat.replace('{p}', String(estimate.vat_percent)) }}</span>
          <span class="calc-num">{{ money(estimate.vat_som) }}</span>
        </div>
        <div class="mt-3 flex items-end justify-between gap-3 border-t border-border pt-3">
          <span class="text-sm font-bold text-foreground">{{ t.total }}</span>
          <span class="calc-num calc-total">{{ money(estimate.total_som) }} <small>so‘m</small></span>
        </div>
        <p
          v-if="estimate.unpriced_count"
          class="mt-2 text-xs font-semibold text-destructive"
        >
          {{ t.unpriced.replace('{n}', String(estimate.unpriced_count)) }}
        </p>
        <p class="mt-3 text-xs leading-relaxed text-muted-foreground">
          {{ t.note.replace('{d}', String(estimate.month_days)).replace('{min}', String(estimate.min_days)) }}
        </p>
      </section>

      <div class="space-y-2 pt-1">
        <button
          v-if="ownerPhone"
          type="button"
          class="btn-brand flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-bold"
          @click="call(ownerPhone)"
        >
          <Phone class="size-4" />
          {{ t.callOwner }}
        </button>
        <button
          type="button"
          class="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-secondary text-sm font-semibold text-foreground active:opacity-80"
          @click="toMap"
        >
          <Plus class="size-4" />
          {{ t.addMore }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.calc-label {
  margin: 0;
  font-family: var(--rb-font-display);
  font-size: 15px;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: var(--foreground);
}
.calc-num { font-variant-numeric: tabular-nums; }

.calc-option,
.calc-preset {
  min-height: 44px;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--foreground);
  font-size: 15px;
  font-weight: 700;
  transition: background var(--rb-dur) var(--rb-ease), color var(--rb-dur) var(--rb-ease), border-color var(--rb-dur) var(--rb-ease);
}
.calc-preset {
  min-height: 36px;
  padding: 0 14px;
  border-radius: var(--rb-r-chip);
  background: var(--secondary);
  border-color: transparent;
  font-size: 13px;
}
.calc-option.is-active,
.calc-preset.is-active {
  background: var(--primary);
  border-color: var(--primary);
  color: var(--primary-foreground);
}

.calc-step {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  border-radius: 9999px;
  background: var(--secondary);
  color: var(--foreground);
}
.calc-step:disabled { opacity: 0.4; }
.calc-step:active:not(:disabled) { transform: scale(0.95); }

.calc-option:focus-visible,
.calc-preset:focus-visible,
.calc-step:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

/* Native spinners fight the − / + buttons. */
.calc-days { appearance: textfield; -moz-appearance: textfield; }
.calc-days::-webkit-outer-spin-button,
.calc-days::-webkit-inner-spin-button { appearance: none; margin: 0; }

.calc-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  font-size: 13.5px;
  color: var(--muted-foreground);
}
.calc-total {
  font-family: var(--rb-font-display);
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.1;
  color: var(--foreground);
}
.calc-total small { font-size: 13px; font-weight: 700; color: var(--muted-foreground); }

@media (prefers-reduced-motion: reduce) {
  .calc-option, .calc-preset { transition: none; }
}
</style>
