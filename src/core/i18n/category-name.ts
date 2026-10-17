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

/**
 * The full ancestor chain ("Dizayn › Logotip") for a nested category — the
 * plain name for a root or when the API did not send the path.
 */
export function categoryFullName(
  category: { name_uz: string, name_ru: string, full_name_uz?: string, full_name_ru?: string },
  locale: Locale,
): string {
  const full = locale === 'ru' ? category.full_name_ru : category.full_name_uz
  return full || categoryName(category, locale)
}
