import type { PublicAgent } from '@/modules/marketplace/services/agents.service'

/**
 * Marketplace capability is derived from the categories a provider serves —
 * never from `provider_type`, which is the KYC/legal track. A profile that
 * only serves designer categories belongs in the Designers group even when it
 * was onboarded as an agency.
 */
export function isDesignerProvider(agent: PublicAgent): boolean {
  const types = agent.categories.map(category => category.type)
  if (types.includes('agent')) return false
  if (types.includes('designer')) return true

  return agent.provider_type === 'designer'
}
