import { openExternalLink } from '@/core/lib/telegram-init'

/**
 * Build a Yandex Maps URL centred on a point (Uzbekistan domain).
 * `pt` is lon,lat — Yandex's parameter order.
 */
export function yandexMapsUrl(
  lat: number,
  lng: number,
  label?: string | null,
): string {
  const url = new URL('https://yandex.uz/maps/')
  url.searchParams.set('pt', `${lng},${lat}`)
  url.searchParams.set('z', '17')
  url.searchParams.set('l', 'map')
  if (label?.trim()) {
    url.searchParams.set('text', label.trim())
  }
  return url.toString()
}

/** Open the point in Yandex Maps (Telegram in-app browser or new tab). */
export function openInYandexMaps(
  lat: number,
  lng: number,
  label?: string | null,
): void {
  openExternalLink(yandexMapsUrl(lat, lng, label))
}
