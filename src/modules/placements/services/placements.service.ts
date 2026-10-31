import { api } from '@/core/api/client'
import type { ApiSuccess } from '@/core/types/api'
import type { Placement, PlacementDetail, PlacementListParams } from '@/modules/placements/types/placement'

/** Public map layer — works for guests too. The whole city fits in one call. */
export async function fetchPlacements(params: PlacementListParams = {}): Promise<Placement[]> {
  const { data } = await api.get<ApiSuccess<Placement[]>>('/api/v1/placements', {
    params: {
      ...params,
      with_price: params.with_price ? 1 : undefined,
      limit: params.limit ?? 1000,
    },
  })

  return data.data
}

export async function fetchPlacement(id: number): Promise<PlacementDetail> {
  const { data } = await api.get<ApiSuccess<PlacementDetail>>(`/api/v1/placements/${id}`)

  return data.data
}
