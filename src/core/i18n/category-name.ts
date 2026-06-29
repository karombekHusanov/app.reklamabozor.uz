import type { Locale } from './messages'

/**
 * Pick the category label for the active locale. Categories only carry Uzbek and
 * Russian names, so English falls back to the Uzbek label.
 */
export function categoryName(
  category: { name_uz: string, name_ru: string },
  locale: Locale,
): string {
  return locale === 'ru' ? category.name_ru : category.name_uz
}
