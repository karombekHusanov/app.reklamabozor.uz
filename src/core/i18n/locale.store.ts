import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import WebApp from '@twa-dev/sdk'
import { messages, type Locale } from './messages'
import { hydratePref, readPref, writePref } from '@/core/lib/cloud-prefs'

export type { Locale }

export const LOCALE_STORAGE_KEY = 'adspace_locale'

const SUPPORTED: Locale[] = ['uz', 'ru', 'en']
const DEFAULT_LOCALE: Locale = 'uz'

function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (SUPPORTED as string[]).includes(value)
}

/** Seed from a stored value, else the Telegram client language, else the default. */
function initialLocale(): Locale {
  const stored = readPref(LOCALE_STORAGE_KEY)
  if (isLocale(stored)) {
    return stored
  }

  try {
    const lang = WebApp.initDataUnsafe?.user?.language_code
    if (lang?.startsWith('ru')) return 'ru'
    if (lang?.startsWith('uz')) return 'uz'
    if (lang?.startsWith('en')) return 'en'
  }
  catch {
    // ignore — Telegram context may be unavailable
  }

  return DEFAULT_LOCALE
}

export const useLocaleStore = defineStore('locale', () => {
  const locale = ref<Locale>(initialLocale())

  const t = computed(() => messages[locale.value])

  function setLocale(next: Locale) {
    if (!isLocale(next)) return
    locale.value = next
  }

  /** Rehydrate from durable CloudStorage on startup (localStorage can be wiped). */
  async function hydrate() {
    const stored = await hydratePref(LOCALE_STORAGE_KEY)
    if (isLocale(stored)) {
      locale.value = stored
    }
  }

  watch(locale, (value) => {
    writePref(LOCALE_STORAGE_KEY, value)
    try {
      document.documentElement.lang = value
    }
    catch {
      // ignore
    }
  }, { immediate: true })

  return {
    locale,
    t,
    setLocale,
    hydrate,
  }
})
