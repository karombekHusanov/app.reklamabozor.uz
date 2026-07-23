import WebApp from '@twa-dev/sdk'

/** Payload sent to the backend's POST /api/v1/auth/telegram endpoint. */
export interface TelegramAuthPayload {
  /** Raw signed initData — the backend verifies its HMAC and derives identity from it. */
  init_data: string
  // Plain fields are dev/test fallbacks; the backend ignores them when verification is on.
  telegram_id: number
  first_name: string
  last_name: string | null
  username: string | null
}

/**
 * True when the running Telegram client supports at least the given Bot API version.
 * Old clients (e.g. 6.0) throw `WebAppMethodUnsupported` for newer methods, so every
 * version-gated call must be guarded — otherwise startup crashes inside Telegram.
 */
export function supportsVersion(version: string): boolean {
  try {
    return WebApp.isVersionAtLeast(version)
  }
  catch {
    return false
  }
}

/** Run a WebApp call, swallowing "unsupported method" errors on old clients. */
function safe(fn: () => void): void {
  try {
    fn()
  }
  catch {
    // method not supported on this Telegram version — ignore
  }
}

export function initializeTelegram(): void {
  safe(() => WebApp.ready())
  safe(() => WebApp.expand())

  // disableVerticalSwipes → Bot API 7.7
  if (supportsVersion('7.7')) {
    safe(() => WebApp.disableVerticalSwipes())
  }

  // setHeaderColor / setBackgroundColor with keyword → Bot API 6.1
  if (supportsVersion('6.1')) {
    safe(() => WebApp.setHeaderColor('secondary_bg_color'))
    safe(() => WebApp.setBackgroundColor('secondary_bg_color'))
  }
}

export function readTelegramInitData(): string {
  return WebApp.initData || window.Telegram?.WebApp?.initData || ''
}

/**
 * Open an external URL (e.g. the Multicard checkout page). Inside Telegram we
 * use WebApp.openLink (opens the in-app browser); outside we fall back to a
 * normal navigation so it also works in a plain browser during dev.
 */
export function openExternalLink(url: string): void {
  if (isInsideTelegram()) {
    try {
      WebApp.openLink(url)
      return
    }
    catch {
      // unsupported on this client — fall through to window.open
    }
  }

  window.open(url, '_blank', 'noopener')
}

/**
 * Open a payment checkout while keeping the user *inside* Telegram.
 *
 * openExternalLink launches an external browser — the checkout AND the
 * gateway's return_url then live in that browser, stranding the user there on
 * return. Instead we navigate the mini app's own webview to the checkout; once
 * payment finishes the gateway redirects to its return_url (the mini app order
 * page), reloading the app back inside Telegram. The auth token survives the
 * reload via localStorage / Telegram CloudStorage (see token-storage.ts).
 */
export function openCheckout(url: string): void {
  window.location.assign(url)
}

/**
 * Deep-link parameter passed via `t.me/<bot>/<app>?startapp=…` launches.
 * (Inline web_app buttons carry the target in the URL itself instead.)
 */
export function readTelegramStartParam(): string | null {
  const unsafe = WebApp.initDataUnsafe as unknown as { start_param?: string }
  return unsafe?.start_param ?? null
}

/** Parse an order deep link such as `order_123` / `order-123` into the order id. */
export function parseOrderStartParam(param: string | null): number | null {
  if (!param) return null
  const match = /^order[_-](\d+)$/.exec(param)
  return match ? Number(match[1]) : null
}

export function isInsideTelegram(): boolean {
  return Boolean(readTelegramUser()) || readTelegramInitData().length > 0
}

/**
 * Read the Telegram user from the WebApp context and map it to the backend payload.
 * Phone is intentionally omitted — it is not part of initData and would require WebApp.requestContact().
 */
export function readTelegramUser(): TelegramAuthPayload | null {
  const tgUser
    = WebApp.initDataUnsafe?.user
      ?? window.Telegram?.WebApp?.initDataUnsafe?.user

  if (!tgUser?.id) {
    return null
  }

  return {
    init_data: readTelegramInitData(),
    telegram_id: tgUser.id,
    first_name: tgUser.first_name?.trim() || tgUser.username || 'Telegram User',
    last_name: tgUser.last_name?.trim() || null,
    username: tgUser.username ?? null,
  }
}

export async function resolveTelegramUser(maxWaitMs = 5000): Promise<TelegramAuthPayload | null> {
  initializeTelegram()

  const deadline = Date.now() + maxWaitMs

  while (Date.now() < deadline) {
    const user = readTelegramUser()

    if (user) {
      return user
    }

    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  return readTelegramUser()
}

interface ContactCapableWebApp {
  requestContact?: (callback: (granted: boolean) => void) => void
}

/**
 * Ask the user to share their phone number. Telegram routes the shared contact to the
 * bot (captured by the backend webhook); this resolves to whether the user agreed.
 */
export function requestTelegramContact(): Promise<boolean> {
  return new Promise((resolve) => {
    const tg = WebApp as unknown as ContactCapableWebApp

    if (typeof tg.requestContact !== 'function') {
      resolve(false)
      return
    }

    try {
      tg.requestContact((granted) => resolve(Boolean(granted)))
    }
    catch {
      resolve(false)
    }
  })
}
