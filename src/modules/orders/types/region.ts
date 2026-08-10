/** District nested under a region (only Tashkent city returns any). */
export interface RegionDistrict {
  id: number
  code: string
  name_uz: string
  name_ru: string
  sort_order: number
}

/** Row from GET /api/v1/regions. */
export interface Region {
  id: number
  code: string
  name_uz: string
  name_ru: string
  sort_order: number
  districts: RegionDistrict[]
}

/** Nested region/district snapshot on an order response (when set). */
export interface OrderRegionRef {
  id: number
  code: string
  name_uz: string
  name_ru: string
}
