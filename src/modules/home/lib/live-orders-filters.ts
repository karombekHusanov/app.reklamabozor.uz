import dayjs from 'dayjs'

export type LiveOrdersDatePreset = 'all' | 'today' | 'week' | 'month'

export interface LiveOrdersFilterState {
  categoryIds: number[]
  regionId: number | null
  districtId: number | null
  datePreset: LiveOrdersDatePreset
}

export const EMPTY_LIVE_ORDERS_FILTERS: LiveOrdersFilterState = {
  categoryIds: [],
  regionId: null,
  districtId: null,
  datePreset: 'all',
}

/** Map a date preset to API `created_from` / `created_to` (YYYY-MM-DD). */
export function datesFromPreset(preset: LiveOrdersDatePreset): {
  created_from: string | null
  created_to: string | null
} {
  const today = dayjs().format('YYYY-MM-DD')
  if (preset === 'today') {
    return { created_from: today, created_to: today }
  }
  if (preset === 'week') {
    return {
      created_from: dayjs().subtract(6, 'day').format('YYYY-MM-DD'),
      created_to: today,
    }
  }
  if (preset === 'month') {
    return {
      created_from: dayjs().subtract(29, 'day').format('YYYY-MM-DD'),
      created_to: today,
    }
  }
  return { created_from: null, created_to: null }
}

export function isFilterActive(state: LiveOrdersFilterState): boolean {
  return state.categoryIds.length > 0
    || state.regionId != null
    || state.districtId != null
    || state.datePreset !== 'all'
}
