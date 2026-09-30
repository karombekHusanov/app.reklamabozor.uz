import dayjs from 'dayjs'
import type { Locale } from '@/core/i18n/messages'
import { localizedDayjs } from '@/core/lib/date'

/** "12 okt – 20 okt" (or a single day) for an order's work window; '' when unset. */
export function formatDeadlineRange(
  from: string | null | undefined,
  to: string | null | undefined,
  locale: Locale,
): string {
  if (!from) return ''
  const start = localizedDayjs(locale, dayjs(from).toDate())
  const fmt = (d: ReturnType<typeof localizedDayjs>) => d.format('D MMM')

  if (!to || to === from) return fmt(start)

  return `${fmt(start)} – ${fmt(localizedDayjs(locale, dayjs(to).toDate()))}`
}

const UNITS: Record<Locale, { million: string, thousand: string, currency: string }> = {
  uz: { million: 'mln', thousand: 'ming', currency: "so'm" },
  ru: { million: 'млн', thousand: 'тыс.', currency: 'сум' },
  en: { million: 'M', thousand: 'K', currency: 'UZS' },
}

/** Rounded, compact budget for list cards: "~5 mln so'm", "~500 ming so'm"; '' when unset. */
export function formatApproxBudget(value: string | number | null | undefined, locale: Locale): string {
  const amount = Number(value)
  if (!Number.isFinite(amount) || amount <= 0) return ''

  const units = UNITS[locale]
  const compact = (n: number) => String(Math.round(n * 10) / 10).replace('.', locale === 'en' ? '.' : ',')

  if (amount >= 1_000_000) return `~${compact(amount / 1_000_000)} ${units.million} ${units.currency}`
  if (amount >= 1_000) return `~${compact(amount / 1_000)} ${units.thousand} ${units.currency}`
  return `~${amount} ${units.currency}`
}
