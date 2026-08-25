import uz from './uz.json'
import ru from './ru.json'
import en from './en.json'

export type Locale = 'uz' | 'ru' | 'en'

export const LOCALES: { value: Locale, label: string }[] = [
  { value: 'uz', label: "O'zbek tili" },
  { value: 'ru', label: 'Русский язык' },
  { value: 'en', label: 'English' },
]

/** The canonical translation shape — every locale mirrors the `uz` keys. */
export type Messages = typeof uz

/**
 * App-wide translations, one JSON file per locale (`uz.json`, `ru.json`,
 * `en.json`). Same nested shape per locale, namespaced by module.
 * Access via the locale store: `locale.t.<ns>.<key>` (see `locale.store.ts`).
 */
export const messages: Record<Locale, Messages> = { uz, ru, en }
