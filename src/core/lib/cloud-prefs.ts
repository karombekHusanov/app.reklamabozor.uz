import WebApp from '@twa-dev/sdk'

/**
 * Durable key/value preference storage for the mini app, generalising the three-layer
 * approach in `token-storage.ts`:
 *   1. in-memory mirror (survives Telegram WebView localStorage wipes for the JS lifetime),
 *   2. `localStorage` hot cache (fast, synchronous),
 *   3. Telegram `CloudStorage` (durable, per-user; rehydrated on startup).
 *
 * Used for small, non-secret settings such as the chosen locale. NOTE: all three layers
 * are shared between Telegram accounts on the same device — never store per-account
 * state here (e.g. onboarding progress); derive that from the backend instead.
 */

interface TelegramCloudStorage {
  getItem: (key: string, cb: (err: string | null, value?: string | null) => void) => void
  setItem: (key: string, value: string, cb?: (err: string | null, stored?: boolean) => void) => void
  removeItem: (key: string, cb?: (err: string | null, removed?: boolean) => void) => void
}

const memory = new Map<string, string>()

function cloudStorage(): TelegramCloudStorage | null {
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

/** Synchronous read: in-memory mirror first, then localStorage (re-seeding the mirror). */
export function readPref(key: string): string | null {
  const mem = memory.get(key)
  if (mem != null) {
    return mem
  }

  try {
    const local = localStorage.getItem(key)
    if (local != null) {
      memory.set(key, local)
      return local
    }
  }
  catch {
    // ignore
  }

  return null
}

export function writePref(key: string, value: string): void {
  memory.set(key, value)

  try {
    localStorage.setItem(key, value)
  }
  catch {
    // ignore — CloudStorage below is the durable layer
  }

  try {
    cloudStorage()?.setItem(key, value)
  }
  catch {
    // unsupported on this client/version
  }
}

export function removePref(key: string): void {
  memory.delete(key)

  try {
    localStorage.removeItem(key)
  }
  catch {
    // ignore
  }

  try {
    cloudStorage()?.removeItem(key)
  }
  catch {
    // ignore
  }
}

/** Restore a preference from durable CloudStorage on startup, re-seeding lower layers. */
export function hydratePref(key: string, timeoutMs = 3000): Promise<string | null> {
  const cached = readPref(key)
  if (cached != null) {
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
      cs.getItem(key, (err, value) => {
        clearTimeout(timer)
        if (!err && value) {
          memory.set(key, value)
          try {
            localStorage.setItem(key, value)
          }
          catch {
            // ignore
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
