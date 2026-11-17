import Sdk from '@twa-dev/sdk'

type TelegramWebApp = typeof Sdk

/**
 * The one Telegram WebApp object. Import THIS, never `@twa-dev/sdk` directly.
 *
 * `@twa-dev/sdk` is CommonJS (`exports.default = WebApp`). Since Vite 8
 * (Rolldown) the default import of it resolves to the module wrapper
 * `{ default: WebApp }` instead of the WebApp itself, so `WebApp.BackButton`,
 * `isVersionAtLeast`, `ready()` … were all `undefined` and every guarded call
 * silently did nothing (no native Back button, no expand, no header colour).
 */
function resolveWebApp(): TelegramWebApp {
  const wrapped = (Sdk as unknown as { default?: TelegramWebApp }).default
  if (wrapped && typeof wrapped === 'object' && 'BackButton' in wrapped) return wrapped
  if (Sdk && typeof Sdk === 'object' && 'BackButton' in Sdk) return Sdk
  const fromWindow = (window as unknown as { Telegram?: { WebApp?: TelegramWebApp } }).Telegram?.WebApp
  return fromWindow ?? Sdk
}

const WebApp: TelegramWebApp = resolveWebApp()

export default WebApp
