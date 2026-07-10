<script setup lang="ts">
import type { Dayjs } from 'dayjs'
import { CalendarDays, ChevronLeft, ChevronRight } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import Drawer from '@/core/ui/Drawer.vue'
import { Button } from '@/core/ui/button'
import { cn } from '@/core/lib/utils'
import { formatDate, localizedDayjs } from '@/core/lib/date'
import { useTelegram } from '@/core/composables/useTelegram'
import { useLocaleStore } from '@/core/i18n/locale.store'

/** ISO date string, e.g. "2026-07-15", or null when unset. */
const model = defineModel<string | null>({ default: null })

const locale = useLocaleStore()
const { haptic } = useTelegram()

const open = ref(false)
// The month currently shown in the calendar (start on the selected date or today).
const view = ref(localizedDayjs(locale.locale, model.value ?? undefined).startOf('month'))

watch(open, (isOpen) => {
  if (isOpen) view.value = localizedDayjs(locale.locale, model.value ?? undefined).startOf('month')
})

const today = computed(() => localizedDayjs(locale.locale).startOf('day'))

const selectedLabel = computed(() => (model.value ? formatDate(model.value, locale.locale) : ''))
const monthLabel = computed(() => view.value.format('MMMM YYYY'))

// Weekday initials, Monday-first. `.day(1)` is this week's Monday; `dd` is the
// localized minimal name (no `localeData` plugin needed).
const weekdays = computed(() => {
  const monday = localizedDayjs(locale.locale).day(1)
  return Array.from({ length: 7 }, (_, i) => monday.add(i, 'day').format('dd'))
})

// Day cells for the visible month, padded with nulls so the 1st lands under its weekday.
const cells = computed<(Dayjs | null)[]>(() => {
  const start = view.value.startOf('month')
  const lead = (start.day() + 6) % 7 // Monday = 0
  const days = view.value.daysInMonth()
  const out: (Dayjs | null)[] = Array.from({ length: lead }, () => null)
  for (let d = 1; d <= days; d++) out.push(start.date(d))
  return out
})

// Never let the user page back into a month that is entirely in the past.
const canGoPrev = computed(() => view.value.startOf('month').isAfter(today.value.startOf('month')))

function isPast(day: Dayjs) {
  return day.isBefore(today.value, 'day')
}
function isSelected(day: Dayjs) {
  return model.value === day.format('YYYY-MM-DD')
}
function isToday(day: Dayjs) {
  return day.isSame(today.value, 'day')
}

function prevMonth() {
  if (!canGoPrev.value) return
  view.value = view.value.subtract(1, 'month')
}
function nextMonth() {
  view.value = view.value.add(1, 'month')
}

function pick(day: Dayjs) {
  if (isPast(day)) return
  haptic('light')
  model.value = day.format('YYYY-MM-DD')
  open.value = false
}
</script>

<template>
  <div>
    <button
      type="button"
      class="glass-input flex w-full items-center gap-3 text-left"
      :class="!model && 'text-muted-foreground'"
      @click="open = true"
    >
      <CalendarDays class="size-5 shrink-0 text-muted-foreground" />
      <span class="grow">{{ selectedLabel || locale.t.orders.wizard.deadlinePlaceholder }}</span>
    </button>

    <Drawer
      v-model:open="open"
      :title="locale.t.orders.wizard.pickDeadlineTitle"
    >
      <!-- Month switcher -->
      <div class="flex items-center justify-between pb-3">
        <button
          type="button"
          class="flex size-9 items-center justify-center rounded-full text-foreground transition active:scale-90 disabled:opacity-30"
          :disabled="!canGoPrev"
          @click="prevMonth"
        >
          <ChevronLeft class="size-5" />
        </button>
        <span class="text-sm font-semibold capitalize text-foreground">{{ monthLabel }}</span>
        <button
          type="button"
          class="flex size-9 items-center justify-center rounded-full text-foreground transition active:scale-90"
          @click="nextMonth"
        >
          <ChevronRight class="size-5" />
        </button>
      </div>

      <!-- Weekday header -->
      <div class="grid grid-cols-7 gap-1 pb-1">
        <span
          v-for="(wd, i) in weekdays"
          :key="i"
          class="py-1 text-center text-xs font-medium capitalize text-muted-foreground"
        >
          {{ wd }}
        </span>
      </div>

      <!-- Day grid -->
      <div class="grid grid-cols-7 gap-1 pb-4">
        <template
          v-for="(day, i) in cells"
          :key="i"
        >
          <span v-if="!day" />
          <button
            v-else
            type="button"
            :disabled="isPast(day)"
            :class="cn(
              'flex aspect-square items-center justify-center rounded-xl text-sm font-medium transition active:scale-90',
              isSelected(day)
                ? 'bg-primary text-primary-foreground shadow'
                : isPast(day)
                  ? 'text-muted-foreground/30'
                  : 'text-foreground hover:bg-muted',
              isToday(day) && !isSelected(day) && 'ring-1 ring-inset ring-primary/40',
            )"
            @click="pick(day)"
          >
            {{ day.date() }}
          </button>
        </template>
      </div>

      <Button
        v-if="model"
        variant="ghost"
        class="h-11 w-full rounded-2xl"
        @click="model = null; open = false"
      >
        {{ locale.t.orders.wizard.clearDeadline }}
      </Button>
    </Drawer>
  </div>
</template>
