export interface MarketplaceFilterState {
  categoryIds: number[]
}

export const EMPTY_MARKETPLACE_FILTERS: MarketplaceFilterState = {
  categoryIds: [],
}

export function isMarketplaceFilterActive(state: MarketplaceFilterState): boolean {
  return state.categoryIds.length > 0
}
