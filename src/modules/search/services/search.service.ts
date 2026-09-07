import { fetchTopAgents, type PublicAgent } from '@/modules/marketplace/services/agents.service'
import { isDesignerProvider } from '@/modules/marketplace/lib/provider-capability'
import type { Category } from '@/modules/agent/types/agent'

/** Providers + services matching one query, already split per section. */
export interface MarketplaceSearchResults {
  agencies: PublicAgent[]
  designers: PublicAgent[]
  services: Category[]
}

const PROVIDER_LIMIT = 20

export const SEARCH_MIN_CHARS = 2

/** Locale-insensitive contains, tolerant of the ' / ʻ / ‘ apostrophe zoo in uz. */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[‘’ʻʼ`´']/g, '')
    .trim()
}

function matchCategories(categories: Category[], query: string): Category[] {
  const needle = normalize(query)
  if (!needle) return []

  return categories
    .filter(category => category.is_active !== false)
    .filter(category =>
      normalize(category.name_uz).includes(needle)
      || normalize(category.name_ru).includes(needle),
    )
}

/**
 * One global search over the marketplace: approved providers (server side,
 * `GET /agents?q=`) plus services matched locally against the already loaded
 * category list — categories are a small, static set, so a round trip per
 * keystroke would buy nothing.
 */
export async function searchMarketplace(
  query: string,
  categories: Category[],
): Promise<MarketplaceSearchResults> {
  const term = query.trim()
  if (term.length < SEARCH_MIN_CHARS) {
    return { agencies: [], designers: [], services: [] }
  }

  const providers = await fetchTopAgents(PROVIDER_LIMIT, undefined, undefined, { q: term })

  return {
    agencies: providers.filter(agent => !isDesignerProvider(agent)),
    designers: providers.filter(isDesignerProvider),
    services: matchCategories(categories, term),
  }
}
