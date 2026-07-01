import { api } from '@/core/api/client'
import type { ApiSuccess } from '@/core/types/api'

export type BannerType = 'agent' | 'product'

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
