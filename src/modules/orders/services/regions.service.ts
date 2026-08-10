import { api } from '@/core/api/client'
import type { ApiSuccess } from '@/core/types/api'
import type { Region } from '@/modules/orders/types/region'

/** Module-level cache — warmed by NewOrderPage, reused by picker / review. */
let cached: Region[] | null = null
let inflight: Promise<Region[]> | null = null

/** Active regions with nested districts (Tashkent only). */
export async function fetchRegions(): Promise<Region[]> {
  if (cached) return cached
  if (inflight) return inflight

  inflight = api
    .get<ApiSuccess<Region[]>>('/api/v1/regions')
    .then(({ data }) => {
      cached = data.data ?? []
      return cached
    })
    .finally(() => {
      inflight = null
    })

  return inflight
}

/** Drop the cache (e.g. after admin catalog changes in long-lived SPA sessions). */
export function clearRegionsCache(): void {
  cached = null
}
