<script setup lang="ts">
/**
 * Inline calendar for picking a date range (from – to). Tap once for the
 * start, tap again for the end; tapping before the start restarts the range.
 * Values are ISO dates (`YYYY-MM-DD`), days before today are disabled.
 */
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import dayjs from 'dayjs'
import { computed, ref, watch } from 'vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { localizedDayjs } from '@/core/lib/date'
import { useTelegram } from '@/core/composables/useTelegram'

const props = defineProps<{
  from: string | null
  to: string | null
}>()

/** `to` stays null while the end date is still being picked. */
const emit = defineEmits<{
  change: [value: { from: string | null, to: string | null }]
}>()

const locale = useLocaleStore()
const { haptic } = useTelegram()

const ISO = 'YYYY-MM-DD'
const today = dayjs().startOf('day')

const draftFrom = ref<string | null>(props.from)
const draftTo = ref<string | null>(props.to)
const month = ref((props.from ? dayjs(props.from) : today).startOf('month'))

watch([draftFrom, draftTo], () => {
  emit('change', { from: draftFrom.value, to: draftTo.value })
})

const monthLabel = computed(() => localizedDayjs(locale.locale, month.value.toDate()).format('MMMM YYYY'))

// Monday-first weekday initials in the app language.
const weekdays = computed(() =>
  [1, 2, 3, 4, 5, 6, 7].map(n => localizedDayjs(locale.locale).day(n % 7).format('dd')),
)

interface Cell { iso: string, day: number, disabled: boolean, isToday: boolean }

const cells = computed<(Cell | null)[]>(() => {
  const first = month.value
  const lead = (first.day() + 6) % 7 // Monday = 0
  const result: (Cell | null)[] = Array.from({ length: lead }, () => null)

  for (let d = 1; d <= first.daysInMonth(); d++) {
    const date = first.date(d)
    result.push({
      iso: date.format(ISO),
      day: d,
      disabled: date.isBefore(today),
      isToday: date.isSame(today, 'day'),
    })
  }

  return result
})

const canGoPrev = computed(() => month.value.isAfter(today.startOf('month')))

function shiftMonth(delta: number) {
  haptic('light')
  month.value = month.value.add(delta, 'month')
}

function pick(cell: Cell) {
  if (cell.disabled) return
  haptic('light')

  // Start a new range when none is open, or the range was complete, or the tap
  // lands before the start.
  if (!draftFrom.value || draftTo.value || cell.iso < draftFrom.value) {
    draftFrom.value = cell.iso
    draftTo.value = null
    return
  }

  draftTo.value = cell.iso
}

/** A single-day range is allowed: tap the start day again. */
function pickSame(cell: Cell) {
  if (draftFrom.value === cell.iso && !draftTo.value) {
    haptic('light')
    draftTo.value = cell.iso
    return
  }
  pick(cell)
}

function state(cell: Cell): 'start' | 'end' | 'between' | 'single' | null {
  const { value: from } = draftFrom
  const to = draftTo.value
  if (!from) return null
  if (cell.iso === from && (!to || to === from)) return to === from ? 'single' : 'start'
  if (cell.iso === from) return 'start'
  if (to && cell.iso === to) return 'end'
  if (to && cell.iso > from && cell.iso < to) return 'between'
  return null
}

const days = computed(() =>
  draftFrom.value && draftTo.value
    ? dayjs(draftTo.value).diff(dayjs(draftFrom.value), 'day') + 1
    : 0,
)

function fmt(iso: string | null): string {
  return iso ? localizedDayjs(locale.locale, dayjs(iso).toDate()).format('D MMM') : '—'
}

</script>

<template>
  <div>
    <div>
      <!-- Month switcher -->
      <div class="mb-2 flex items-center justify-between">
        <button
          type="button"
          class="nav-btn"
          :disabled="!canGoPrev"
          :aria-label="locale.t.orders.form.prevMonth"
          @click="shiftMonth(-1)"
        >
          <ChevronLeft class="size-5" />
        </button>
        <p class="text-[15px] font-bold capitalize text-foreground">
          {{ monthLabel }}
        </p>
        <button
          type="button"
          class="nav-btn"
          :aria-label="locale.t.orders.form.nextMonth"
          @click="shiftMonth(1)"
        >
          <ChevronRight class="size-5" />
        </button>
      </div>

      <div class="grid grid-cols-7 text-center">
        <span
          v-for="(name, index) in weekdays"
          :key="index"
          class="py-1 text-[11.5px] font-semibold uppercase text-muted-foreground"
        >{{ name }}</span>

        <template
          v-for="(cell, index) in cells"
          :key="index"
        >
          <span v-if="!cell" />
          <button
            v-else
            type="button"
            class="day"
            :class="[
              state(cell) ? `day--${state(cell)}` : '',
              cell.isToday ? 'day--today' : '',
            ]"
            :disabled="cell.disabled"
            :aria-pressed="!!state(cell)"
            @click="pickSame(cell)"
          >
            <span class="day__num">{{ cell.day }}</span>
          </button>
        </template>
      </div>

      <!-- Summary + confirm -->
      <div class="mt-3 flex items-center justify-between rounded-2xl bg-secondary/70 px-4 py-2.5">
        <div class="min-w-0">
          <p class="text-[11.5px] font-medium text-muted-foreground">
            {{ locale.t.orders.form.deadlineFromTo }}
          </p>
          <p class="text-[14px] font-bold tabular-nums text-foreground">
            {{ fmt(draftFrom) }} → {{ fmt(draftTo) }}
          </p>
        </div>
        <span
          v-if="days > 0"
          class="rounded-full bg-primary/10 px-2.5 py-1 text-[12px] font-bold text-primary"
        >{{ days }} {{ locale.t.orders.form.daysSuffix }}</span>
      </div>

      <p
        v-if="draftFrom && !draftTo"
        class="mt-2 text-center text-[12.5px] text-muted-foreground"
      >
        {{ locale.t.orders.form.pickEndHint }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.nav-btn {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 999px;
  background: var(--secondary);
  color: var(--foreground);
  cursor: pointer;
}
.nav-btn:disabled { opacity: 0.35; cursor: default; }
.nav-btn:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }

.day {
  position: relative;
  display: grid;
  place-items: center;
  height: 44px;
  border: 0;
  background: transparent;
  color: var(--foreground);
  font-size: 14.5px;
  font-weight: 600;
  cursor: pointer;
}
.day:disabled { color: var(--muted-foreground); opacity: 0.4; cursor: default; }
.day:focus-visible { outline: 2px solid var(--primary); outline-offset: -2px; border-radius: 12px; }

.day__num {
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 999px;
}
.day--today .day__num { box-shadow: inset 0 0 0 1.5px var(--primary); }

/* Range band behind the numbers */
.day--between { background: color-mix(in oklab, var(--primary) 12%, transparent); }
.day--start { background: linear-gradient(to right, transparent 50%, color-mix(in oklab, var(--primary) 12%, transparent) 50%); }
.day--end { background: linear-gradient(to left, transparent 50%, color-mix(in oklab, var(--primary) 12%, transparent) 50%); }
.day--single { background: transparent; }

.day--start .day__num,
.day--end .day__num,
.day--single .day__num {
  background: var(--primary);
  color: var(--primary-foreground);
}
</style>
