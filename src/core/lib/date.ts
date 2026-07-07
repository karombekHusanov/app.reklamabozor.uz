import dayjs from 'dayjs'
import 'dayjs/locale/ru'
import 'dayjs/locale/uz-latn'
import type { Locale } from '@/core/i18n/messages'

// App locale → dayjs locale (Uzbek uses the Latin script).
const DAYJS_LOCALE: Record<Locale, string> = {
  uz: 'uz-latn',
  ru: 'ru',
  en: 'en',
}

/** Human-readable date, e.g. "1 iyul 2026" — localized via dayjs. */
export function formatDate(value: string | Date | null | undefined, locale: Locale): string {
  if (!value) return ''
  return dayjs(value).locale(DAYJS_LOCALE[locale]).format('D MMMM YYYY')
}

/** Compact chat timestamp: time only for today, date + time otherwise. */
export function formatMessageTime(value: string | Date | null | undefined, locale: Locale): string {
  if (!value) return ''
  const d = dayjs(value).locale(DAYJS_LOCALE[locale])
  return d.isSame(dayjs(), 'day') ? d.format('HH:mm') : d.format('D MMM, HH:mm')
}

/** Short numeric date, e.g. 10.05.2024 */
export function formatShortDate(value: string | Date | null | undefined): string {
  if (!value) return ''
  return dayjs(value).format('DD.MM.YYYY')
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
