import type { Locale } from './messages'

/**
 * Pick the region/district label for the active locale. Catalog only carries
 * Uzbek and Russian names, so English falls back to the Uzbek label.
 */
export function regionName(
  region: { name_uz: string, name_ru: string },
  locale: Locale,
): string {
  return locale === 'ru' ? region.name_ru : region.name_uz
}
