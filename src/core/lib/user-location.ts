import WebApp from '@twa-dev/sdk'
import { initializeTelegram, isInsideTelegram, supportsVersion } from '@/core/lib/telegram-init'

export interface UserCoordinates {
  lat: number
  lng: number
  accuracy?: number
}

const INIT_TIMEOUT_MS = 10_000
const LOCATION_TIMEOUT_MS = 45_000

/**
 * Resolve the user's current coordinates.
 * Inside Telegram (prod) uses LocationManager (Bot API 8.0+); otherwise falls
 * back to the browser Geolocation API for local dev.
 */
export async function getUserLocation(): Promise<UserCoordinates | null> {
  if (isInsideTelegram() && supportsVersion('8.0')) {
    const tg = await getTelegramLocation()
    if (tg) return tg
    // Browser geolocation is unreliable inside the Telegram WebView — don't fall back.
    return null
  }

  return getBrowserLocation()
}

/** True when Telegram already has location permission for this bot. */
export function hasLocationAccess(): boolean {
  if (!isInsideTelegram() || !supportsVersion('8.0')) return false

  const manager = WebApp.LocationManager
  return Boolean(manager?.isInited && manager.isAccessGranted)
}

/**
 * Initialise Telegram's LocationManager early so the first fix is faster.
 * Safe to call multiple times.
 */
export async function warmupLocationManager(): Promise<void> {
  if (!isInsideTelegram() || !supportsVersion('8.0')) return

  initializeTelegram()
  await ensureLocationManagerInited()
}

async function getTelegramLocation(): Promise<UserCoordinates | null> {
  const manager = WebApp.LocationManager
  if (!manager) return null

  const ready = await ensureLocationManagerInited()
  if (!ready || !manager.isLocationAvailable) return null

  return withTimeout(new Promise<UserCoordinates | null>((resolve) => {
    try {
      manager.getLocation((data) => {
        if (!data) {
          resolve(null)
          return
        }

        const accuracy = data.horizontal_accuracy
        resolve({
          lat: data.latitude,
          lng: data.longitude,
          accuracy: typeof accuracy === 'number' && accuracy > 0 ? accuracy : undefined,
        })
      })
    }
    catch {
      resolve(null)
    }
  }), LOCATION_TIMEOUT_MS)
}

function ensureLocationManagerInited(): Promise<boolean> {
  const manager = WebApp.LocationManager
  if (!manager) return Promise.resolve(false)

  if (manager.isInited) return Promise.resolve(true)

  return withTimeout(new Promise<boolean>((resolve) => {
    try {
      manager.init(() => resolve(true))
    }
    catch {
      resolve(false)
    }
  }), INIT_TIMEOUT_MS).then(result => result ?? manager.isInited)
}

function getBrowserLocation(): Promise<UserCoordinates | null> {
  if (!navigator.geolocation) return Promise.resolve(null)

  return withTimeout(new Promise<UserCoordinates | null>((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        })
      },
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 },
    )
  }), LOCATION_TIMEOUT_MS)
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>(resolve => setTimeout(() => resolve(null), ms)),
  ])
}
