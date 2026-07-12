import { onBeforeUnmount, onMounted, ref } from 'vue'
import WebApp from '@twa-dev/sdk'
import { isInsideTelegram, supportsVersion } from '@/core/lib/telegram-init'

function readVisualViewportInset(): number {
  const vv = window.visualViewport
  if (!vv) return 0
  return Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
}

function readTelegramViewportInset(): number {
  try {
    const stable = WebApp.viewportStableHeight
    const current = WebApp.viewportHeight
    if (stable > 0 && current > 0) {
      return Math.max(0, stable - current)
    }
  }
  catch {
    // unsupported client
  }
  return 0
}

/** Bottom offset when the on-screen keyboard shrinks the visible viewport. */
export function useKeyboardInset() {
  const inset = ref(0)

  function update() {
    const tgInset = isInsideTelegram() ? readTelegramViewportInset() : 0
    inset.value = Math.max(tgInset, readVisualViewportInset())
  }

  onMounted(() => {
    update()
    window.visualViewport?.addEventListener('resize', update)
    window.visualViewport?.addEventListener('scroll', update)
    window.addEventListener('resize', update)

    if (isInsideTelegram() && supportsVersion('6.0')) {
      WebApp.onEvent('viewportChanged', update)
    }
  })

  onBeforeUnmount(() => {
    window.visualViewport?.removeEventListener('resize', update)
    window.visualViewport?.removeEventListener('scroll', update)
    window.removeEventListener('resize', update)

    if (isInsideTelegram() && supportsVersion('6.0')) {
      WebApp.offEvent('viewportChanged', update)
    }
  })

  return { inset }
}
