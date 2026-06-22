import WebApp from '@twa-dev/sdk'
import { computed } from 'vue'
import { initializeTelegram, readTelegramInitData } from '@/core/lib/telegram-init'

export function useTelegram() {
  const isAvailable = computed(() => readTelegramInitData().length > 0)
  const initData = computed(() => readTelegramInitData())
  const colorScheme = computed(() => WebApp.colorScheme)
  const user = computed(() => WebApp.initDataUnsafe.user)

  function initialize() {
    initializeTelegram()
  }

  function haptic(type: 'light' | 'medium' | 'heavy' = 'light') {
    // HapticFeedback throws on old Telegram clients (< 6.1) — never let a tap crash.
    try {
      WebApp.HapticFeedback?.impactOccurred(type)
    }
    catch {
      // unsupported on this client — ignore
    }
  }

  return {
    WebApp,
    isAvailable,
    initData,
    colorScheme,
    user,
    initialize,
    haptic,
  }
}
