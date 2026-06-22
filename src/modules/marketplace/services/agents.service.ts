import { api } from '@/core/api/client'
import type { ApiSuccess } from '@/core/types/api'
import type { Category } from '@/modules/agent/types/agent'

export interface PublicAgent {
  id: number
  company_name: string
  company_logo: string | null
  bio: string | null
  location_label: string | null
  website_url: string | null
  completion_percent: number
  categories: Category[]
}

/** Top approved agents (ranked by profile completeness) for the home slider / marketplace. */
export async function fetchTopAgents(limit = 10): Promise<PublicAgent[]> {
  const { data } = await api.get<ApiSuccess<PublicAgent[]>>('/api/v1/agents', {
    params: { limit },
  })

  return data.data
}
