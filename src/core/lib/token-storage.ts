import WebApp from '@twa-dev/sdk'
import { TOKEN_STORAGE_KEY } from '@/core/constants'

/**
 * Telegram's in-app WebView does NOT reliably persist `localStorage` across mini app
 * re-opens — each open can start with empty storage, and it can even be wiped mid-session,
 * which silently logs the user out. We therefore keep three layers:
 *   1. an in-memory mirror (the source of truth for the synchronous request interceptor —
 *      survives localStorage wipes for the lifetime of the JS context),
 *   2. `localStorage` as a fast hot cache,
 *   3. Telegram `CloudStorage` as the durable, per-user store used to rehydrate on startup.
 */

interface TelegramCloudStorage {
  getItem: (key: string, cb: (err: string | null, value?: string | null) => void) => void
  setItem: (key: string, value: string, cb?: (err: string | null, stored?: boolean) => void) => void
  removeItem: (key: string, cb?: (err: string | null, removed?: boolean) => void) => void
}

let memoryToken: string | null = null

function cloudStorage(): TelegramCloudStorage | null {
  // CloudStorage requires Bot API 6.9 — calling it on older clients (e.g. 6.0)
  // logs/throws "CloudStorage is not supported". Skip it entirely there.
  try {
    if (!WebApp.isVersionAtLeast('6.9')) {
      return null
    }
  }
  catch {
    return null
  }

  const cs = (WebApp as unknown as { CloudStorage?: TelegramCloudStorage }).CloudStorage

  return cs && typeof cs.getItem === 'function' ? cs : null
}

function readLocal(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY)
  }
  catch {
    return null
  }
}

/**
 * Synchronous token getter used by the axios interceptor. Prefers the in-memory
 * mirror, falling back to (and re-seeding from) the localStorage hot cache.
 */
export function currentToken(): string | null {
  if (memoryToken) {
    return memoryToken
  }

  const local = readLocal()
  if (local) {
    memoryToken = local
  }

  return local
}

export function readToken(): string | null {
  return currentToken()
}

export function persistToken(token: string): void {
  memoryToken = token

  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token)
  }
  catch {
    // ignore — CloudStorage below is the durable layer
  }

  try {
    cloudStorage()?.setItem(TOKEN_STORAGE_KEY, token)
  }
  catch {
    // CloudStorage unsupported on this client/version — localStorage will have to do
  }
}

export function clearToken(): void {
  memoryToken = null

  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
  }
  catch {
    // ignore
  }

  try {
    cloudStorage()?.removeItem(TOKEN_STORAGE_KEY)
  }
  catch {
    // ignore
  }
}

/**
 * Restore the token from durable storage on startup. The in-memory mirror / localStorage
 * (hot cache) win when present; otherwise we fall back to CloudStorage and re-seed both
 * lower layers so the synchronous request interceptor keeps working for the session.
 */
export function hydrateToken(timeoutMs = 3000): Promise<string | null> {
  const cached = currentToken()

  if (cached) {
    return Promise.resolve(cached)
  }

  const cs = cloudStorage()

  if (!cs) {
    return Promise.resolve(null)
  }

  return new Promise((resolve) => {
    let settled = false

    const finish = (value: string | null) => {
      if (settled) return
      settled = true
      resolve(value)
    }

    const timer = setTimeout(() => finish(null), timeoutMs)

    try {
      cs.getItem(TOKEN_STORAGE_KEY, (err, value) => {
        clearTimeout(timer)

        if (!err && value) {
          memoryToken = value

          try {
            localStorage.setItem(TOKEN_STORAGE_KEY, value)
          }
          catch {
            // ignore — the in-memory mirror still holds the value
          }
          finish(value)
        }
        else {
          finish(null)
        }
      })
    }
    catch {
      clearTimeout(timer)
      finish(null)
    }
  })
}
