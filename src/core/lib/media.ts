// The API returns host-less file paths (e.g. "/storage/uploads/foo.jpg") so links
// never bake in a stale server host. The client resolves them for the current runtime:
//   • production → prepend VITE_API_BASE_URL (api.reklamabozor.uz)
//   • local Vite with empty base → same-origin `/storage` (proxied to :8000)
//   • LAN / Telegram tunnel where API base is 127.0.0.1 → same-origin `/storage`
//     so the phone/WebView never tries to fetch the developer's localhost.

const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '')

function apiHostIsLoopback(origin: string): boolean {
  try {
    const host = new URL(origin).hostname
    return host === 'localhost' || host === '127.0.0.1' || host === '::1'
  }
  catch {
    return false
  }
}

/**
 * When the configured API base is loopback but the page is served from another
 * host (LAN IP, Cloudflare tunnel, Telegram WebView), absolute
 * `http://127.0.0.1:8000/storage/…` URLs are unreachable / mixed-content.
 * Prefer same-origin `/storage/…` and let the Vite (or nginx) proxy forward them.
 */
function preferSameOriginStorage(): boolean {
  if (!API_ORIGIN) return true
  if (typeof window === 'undefined') return false
  if (!apiHostIsLoopback(API_ORIGIN)) return false
  return window.location.hostname !== new URL(API_ORIGIN).hostname
}

/** Prepend the configured API base URL to a host-less "/storage/…" path. */
export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null

  let storagePath: string | null = null

  if (/^https?:\/\//i.test(path)) {
    try {
      const url = new URL(path)
      if (url.pathname.startsWith('/storage/')) {
        storagePath = `${url.pathname}${url.search}`
      }
      else {
        return path
      }
    }
    catch {
      return path
    }
  }
  else if (path.startsWith('/storage/')) {
    storagePath = path
  }
  else {
    return path
  }

  if (preferSameOriginStorage()) {
    return storagePath
  }

  return API_ORIGIN ? `${API_ORIGIN}${storagePath}` : storagePath
}

/** Recursively rewrite host-less "/storage/…" paths in an API payload to usable URLs. */
export function absolutizeMediaUrls<T>(data: T): T {
  if (typeof data === 'string') {
    return (mediaUrl(data) ?? data) as unknown as T
  }
  if (Array.isArray(data)) {
    return data.map(item => absolutizeMediaUrls(item)) as unknown as T
  }
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    for (const key of Object.keys(obj)) {
      obj[key] = absolutizeMediaUrls(obj[key])
    }
  }
  return data
}
