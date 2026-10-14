import type { PublicAgent } from '@/modules/marketplace/services/agents.service'

/**
 * Marketplace capability is derived from the categories a provider serves —
 * never from `provider_type`, which is the legal track (agent = legal entity,
 * individual = jismoniy). A profile that only serves designer categories
 * belongs in the Designers group whichever track it is on.
 */
export function isDesignerProvider(agent: PublicAgent): boolean {
  const types = agent.categories.map(category => category.type)
  if (types.includes('agent')) return false

  return types.includes('designer')
}
