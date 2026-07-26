import { api } from '@/core/api/client'
import type { ApiSuccess } from '@/core/types/api'

export type BannerType = 'agent' | 'product' | 'link'

export interface Banner {
  id: number
  title: string | null
  subtitle: string | null
  type: BannerType
  target_id: number | null
  image: string | null
  link_url: string | null
  sort_order: number
}

/** Active promo banners for the home slider, ordered by sort weight. */
export async function fetchBanners(): Promise<Banner[]> {
  const { data } = await api.get<ApiSuccess<Banner[]>>('/api/v1/banners')

  return data.data
}

/**
 * Fire-and-forget analytics pings. Tracking must never disrupt the UI, so
 * failures are swallowed. Impressions are deduped per session by the caller.
 */
export function trackBannerView(id: number): void {
  void api.post(`/api/v1/banners/${id}/view`).catch(() => {})
}

export function trackBannerClick(id: number): void {
  void api.post(`/api/v1/banners/${id}/click`).catch(() => {})
}
