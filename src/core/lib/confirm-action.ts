import WebApp from '@twa-dev/sdk'
import { isInsideTelegram, supportsVersion } from '@/core/lib/telegram-init'

/** Native Telegram confirm when available, the browser's otherwise. */
export function confirmAction(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (isInsideTelegram() && supportsVersion('6.2') && typeof WebApp.showConfirm === 'function') {
      try {
        WebApp.showConfirm(message, confirmed => resolve(Boolean(confirmed)))
        return
      }
      catch {
        // fall through to the browser confirm
      }
    }
    resolve(window.confirm(message))
  })
}
