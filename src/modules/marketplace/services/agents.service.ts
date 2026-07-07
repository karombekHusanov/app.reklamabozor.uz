import { api } from '@/core/api/client'
import type { ApiSuccess } from '@/core/types/api'
import type { Category } from '@/modules/agent/types/agent'

export interface PublicAgent {
  id: number
  company_name: string
  company_logo: string | null
  bio: string | null
  location_label: string | null
  /** Decimal strings (decimal:7) or null when the agent hasn't set a location. */
  lat: string | null
  lng: string | null
  website_url: string | null
  completion_percent: number
  /** Number of accepted offers that ended in a completed order (successful jobs). */
  completed_orders_count: number
  /** Average of approved (moderated) client ratings — null until the first one. */
  rating_avg: number | null
  rating_count: number
  categories: Category[]
  /** Distance from the requested point in metres — only on the nearby endpoint. */
  distance_m?: number
}

/** Top approved agents (ranked by profile completeness) for the home slider / marketplace. */
export async function fetchTopAgents(limit = 10): Promise<PublicAgent[]> {
  const { data } = await api.get<ApiSuccess<PublicAgent[]>>('/api/v1/agents', {
    params: { limit },
  })

  return data.data
}

/** Approved agents nearest to a point, ordered by distance (for the new-order form). */
export async function fetchNearbyAgents(lat: number, lng: number, limit = 5): Promise<PublicAgent[]> {
  const { data } = await api.get<ApiSuccess<PublicAgent[]>>('/api/v1/agents/nearby', {
    params: { lat, lng, limit },
  })

  return data.data
}

/** Single approved agent for the public marketplace profile page. */
export async function fetchPublicAgent(id: number): Promise<PublicAgent> {
  const { data } = await api.get<ApiSuccess<PublicAgent>>(`/api/v1/agents/${id}`)

  return data.data
}
