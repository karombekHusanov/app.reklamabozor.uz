// The API returns host-less file paths (e.g. "/storage/uploads/foo.jpg") so links
// never bake in a stale server host. The client prepends its own API base URL.
const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '')

/** Prepend the configured API base URL to a host-less "/storage/…" path. */
export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (/^https?:\/\//i.test(path)) return path
  if (path.startsWith('/storage/')) return `${API_ORIGIN}${path}`
  return path
}

/** Recursively rewrite host-less "/storage/…" paths in an API payload to absolute URLs. */
export function absolutizeMediaUrls<T>(data: T): T {
  if (typeof data === 'string') {
    return (data.startsWith('/storage/') ? `${API_ORIGIN}${data}` : data) as unknown as T
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
