import { api } from '@/core/api/client'

/**
 * Private files (KYC scans, contracts, invoices, acts) are no longer served
 * from the public `/storage` disk — the API returns `/api/v1/files/{id}`,
 * which requires the Bearer token and streams the bytes. A plain `<a href>`
 * or `<img src>` would hit it unauthenticated and get a 401, so these URLs
 * are fetched through the axios client and surfaced as blob object URLs.
 * Public files keep their `/storage/…` URLs and the old direct-link behavior.
 *
 * Telegram's WebView cannot open a `blob:` URL through `WebApp.openLink`, so
 * the mini app previews the blob inline (see `ProtectedFileViewer.vue`).
 */
const PROTECTED_PATH = '/api/v1/files/'

export function isProtectedFileUrl(url: string | null | undefined): url is string {
  if (!url) return false
  if (url.startsWith(PROTECTED_PATH)) return true
  try {
    return new URL(url, window.location.origin).pathname.startsWith(PROTECTED_PATH)
  }
  catch {
    return false
  }
}

export interface ProtectedFile {
  blob: Blob
  /** Object URL — revoke with `URL.revokeObjectURL` when no longer displayed. */
  objectUrl: string
  /** Best-effort file name (Content-Disposition, else the caller's hint + mime extension). */
  name: string
  mimeType: string
}

const MIME_EXTENSIONS: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

function nameFromDisposition(header: string | undefined): string | null {
  if (!header) return null
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(header)
  if (utf8?.[1]) {
    try {
      return decodeURIComponent(utf8[1])
    }
    catch {
      // fall through to the plain filename
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(header)
  return plain?.[1]?.trim() || null
}

function withExtension(name: string, mimeType: string): string {
  if (/\.[a-z0-9]{2,5}$/i.test(name)) return name
  const ext = MIME_EXTENSIONS[mimeType]
  return ext ? `${name}.${ext}` : name
}

/** Download a protected file with the Bearer token and wrap it in an object URL. */
export async function fetchProtectedFile(url: string, nameHint = 'file'): Promise<ProtectedFile> {
  // The global error toast would only say "status 403" for a blob body — the
  // caller shows its own localized message instead.
  const response = await api.get<Blob>(url, { responseType: 'blob', skipErrorToast: true })
  const headerType = String(response.headers['content-type'] ?? '').split(';')[0]?.trim()
  const mimeType = response.data.type || headerType || 'application/octet-stream'
  const blob = response.data.type ? response.data : new Blob([response.data], { type: mimeType })
  const disposition = response.headers['content-disposition'] as string | undefined
  const name = nameFromDisposition(disposition) ?? withExtension(nameHint, mimeType)

  return { blob, objectUrl: URL.createObjectURL(blob), name, mimeType }
}

/** Trigger a browser download of a blob under the given name. */
export function downloadBlob(objectUrl: string, name: string): void {
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = name
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}
