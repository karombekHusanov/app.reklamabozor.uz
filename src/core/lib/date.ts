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
