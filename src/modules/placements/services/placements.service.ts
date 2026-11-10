import { api } from '@/core/api/client'
import type { ApiSuccess } from '@/core/types/api'
import type { AdFormat, MetroLineData, Placement, PlacementDetail, PlacementEstimate, PlacementListParams } from '@/modules/placements/types/placement'

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

/** Calculator — the server owns the maths (rate by clip length, pro-rated by days, VAT). */
export async function estimatePlacements(
  placementIds: number[],
  days: number,
  slotSeconds: number,
  formats: { format_id: number, quantity: number }[] = [],
): Promise<PlacementEstimate> {
  const { data } = await api.post<ApiSuccess<PlacementEstimate>>('/api/v1/placements/estimate', {
    placement_ids: placementIds.length ? placementIds : undefined,
    formats: formats.length ? formats : undefined,
    days,
    slot_seconds: slotSeconds,
  })

  return data.data
}

/** Metro format catalogue (15 formats, 3 of them network packages). */
export async function fetchAdFormats(): Promise<AdFormat[]> {
  const { data } = await api.get<ApiSuccess<AdFormat[]>>('/api/v1/ad-formats', { params: { venue: 'metro' } })

  return data.data
}

/** Metro lines + stations for the map's "Metro" layer (static reference data). */
export async function fetchMetroLines(): Promise<MetroLineData[]> {
  const { data } = await api.get<ApiSuccess<{ lines: MetroLineData[] }>>('/api/v1/metro/lines')

  return data.data.lines
}
