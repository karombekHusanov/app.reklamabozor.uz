import { defineStore } from 'pinia'
import WebApp from '@twa-dev/sdk'
import { computed, ref, watch } from 'vue'
import { hydratePref, readPref, writePref } from '@/core/lib/cloud-prefs'

export type ThemeMode = 'auto' | 'light' | 'dark'

export const THEME_STORAGE_KEY = 'adspace_theme'

const MODES: ThemeMode[] = ['auto', 'light', 'dark']

function isThemeMode(value: unknown): value is ThemeMode {
  return typeof value === 'string' && (MODES as string[]).includes(value)
}

function telegramScheme(): 'light' | 'dark' {
  try {
    return WebApp.colorScheme === 'dark' ? 'dark' : 'light'
  }
  catch {
    return 'light'
  }
}

function resolve(mode: ThemeMode): 'light' | 'dark' {
  return mode === 'auto' ? telegramScheme() : mode
}

function applyScheme(scheme: 'light' | 'dark') {
  document.documentElement.classList.toggle('dark', scheme === 'dark')
}

export const useThemeStore = defineStore('theme', () => {
  const stored = readPref(THEME_STORAGE_KEY)
  const mode = ref<ThemeMode>(isThemeMode(stored) ? stored : 'auto')

  let telegramListenerAttached = false

  const resolved = computed(() => resolve(mode.value))

  function apply() {
    applyScheme(resolve(mode.value))
  }

  function setMode(next: ThemeMode) {
    if (!isThemeMode(next)) return
    mode.value = next
  }

  async function hydrate() {
    const value = await hydratePref(THEME_STORAGE_KEY)
    if (isThemeMode(value)) {
      mode.value = value
    }
    apply()
  }

  function bindTelegram() {
    if (telegramListenerAttached) return
    telegramListenerAttached = true

    try {
      WebApp.onEvent('themeChanged', () => {
        if (mode.value === 'auto') apply()
      })
    }
    catch {
      // old client
    }
  }

  function init() {
    apply()
    bindTelegram()
  }

  watch(mode, (value) => {
    writePref(THEME_STORAGE_KEY, value)
    apply()
  }, { immediate: true })

  return {
    mode,
    resolved,
    setMode,
    hydrate,
    init,
  }
})
