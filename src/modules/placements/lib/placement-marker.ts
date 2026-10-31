import L from 'leaflet'

/**
 * Pins for advertising placements: a small "screen" glyph (never the PRB logo
 * circle used for agencies, never the orange request dot). Exact positions —
 * a screen on a street is public information.
 */
export function placementIcon(options: { selected: boolean, priced: boolean, label?: string | null }): L.DivIcon {
  const classes = ['rb-screen-pin']
  if (options.selected) classes.push('rb-screen-pin--selected')
  if (!options.priced) classes.push('rb-screen-pin--unpriced')

  const label = options.label ? `<span class="rb-screen-pin__label">${escapeHtml(options.label)}</span>` : ''

  return L.divIcon({
    className: 'rb-screen-pin-wrap',
    html: `<div class="${classes.join(' ')}"><span class="rb-screen-pin__glyph"></span>${label}</div>`,
    iconSize: [28, 34],
    iconAnchor: [14, 34],
  })
}

/** Cluster bubble: count of screens inside, highlighted when any is selected. */
export function clusterIcon(count: number, hasSelected: boolean): L.DivIcon {
  const size = count >= 50 ? 46 : count >= 10 ? 40 : 34

  return L.divIcon({
    className: 'rb-screen-cluster-wrap',
    html: `<div class="rb-screen-cluster${hasSelected ? ' rb-screen-cluster--selected' : ''}" style="width:${size}px;height:${size}px">${count}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

/** "250k" style short price for the pin label. */
export function shortPrice(som: number | null | undefined): string | null {
  if (som == null || som <= 0) return null
  if (som >= 1_000_000) return `${trimZero(som / 1_000_000)}M`
  if (som >= 1_000) return `${Math.round(som / 1_000)}k`
  return String(som)
}

function trimZero(n: number): string {
  return n.toFixed(1).replace(/\.0$/, '')
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[ch] ?? ch))
}
