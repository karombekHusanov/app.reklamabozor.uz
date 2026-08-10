import dayjs from 'dayjs'
import 'dayjs/locale/ru'
import 'dayjs/locale/uz-latn'
import type { Locale } from '@/core/i18n/messages'

/** Project-wide absolute date: 29.07.2026 */
export const DATE_FORMAT = 'DD.MM.YYYY'

/** Project-wide absolute datetime: 29.07.2026, 14:30 */
export const DATETIME_FORMAT = 'DD.MM.YYYY, HH:mm'

// App locale → dayjs locale (Uzbek uses the Latin script).
const DAYJS_LOCALE: Record<Locale, string> = {
  uz: 'uz-latn',
  ru: 'ru',
  en: 'en',
}

/** A dayjs instance bound to the app locale — for calendar UI labels only. */
export function localizedDayjs(locale: Locale, value?: string | Date) {
  return dayjs(value).locale(DAYJS_LOCALE[locale])
}

/** Absolute date: DD.MM.YYYY */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return ''
  const d = dayjs(value)
  return d.isValid() ? d.format(DATE_FORMAT) : ''
}

/** Absolute datetime: DD.MM.YYYY, HH:mm */
export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return ''
  const d = dayjs(value)
  return d.isValid() ? d.format(DATETIME_FORMAT) : ''
}

/** @deprecated Use formatDate — same DD.MM.YYYY output. */
export function formatShortDate(value: string | Date | null | undefined): string {
  return formatDate(value)
}

/**
 * Timestamps in lists/bubbles — same project datetime format.
 * Kept as a named helper so chat call sites stay readable.
 */
export function formatMessageTime(value: string | Date | null | undefined): string {
  return formatDateTime(value)
}

/**
 * Chat day-separator label: "Today" / "Yesterday" (callers pass the localized
 * words) or DD.MM.YYYY for older days.
 */
export function formatDaySeparator(
  value: string | Date | null | undefined,
  todayLabel: string,
  yesterdayLabel: string,
): string {
  if (!value) return ''
  const d = dayjs(value)
  if (!d.isValid()) return ''
  if (d.isSame(dayjs(), 'day')) return todayLabel
  if (d.isSame(dayjs().subtract(1, 'day'), 'day')) return yesterdayLabel
  return formatDate(value)
}

/** Duration on platform, e.g. { years: 1, months: 8 } */
export function memberDuration(value: string | Date | null | undefined): { years: number, months: number } {
  if (!value) return { years: 0, months: 0 }
  const totalMonths = Math.max(0, dayjs().diff(dayjs(value), 'month'))
  return {
    years: Math.floor(totalMonths / 12),
    months: totalMonths % 12,
  }
}
