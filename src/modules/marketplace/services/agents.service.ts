import { api } from '@/core/api/client'
import type { ApiSuccess } from '@/core/types/api'
import type { Advantage, Category, PortfolioItem, WorkflowStep } from '@/modules/agent/types/agent'

export interface PublicReview {
  id: number
  rating: number
  comment: string | null
  created_at: string
  client_name: string
  client_avatar: string | null
}

export interface PublicAgent {
  id: number
  user_id: number
  company_name: string | null
  /** Studio nomi bo'lmasa — shaxsning jonli ism-familiyasi. */
  display_name: string
  /** User Telegram avatari (dizaynerlar uchun asosiy rasm). */
  avatar: string | null
  provider_type: 'agent' | 'designer'
  company_logo: string | null
  bio: string | null
  location_label: string | null
  /** Decimal strings (decimal:7) or null when the agent hasn't set a location. */
  lat: string | null
  lng: string | null
  website_url: string | null
  linkedin_url: string | null
  results_text: string | null
  completion_percent: number
  /** Number of accepted offers that ended in a completed order (successful jobs). */
  completed_orders_count: number
  /** Average of approved (moderated) client ratings — null until the first one. */
  rating_avg: number | null
  rating_count: number
  categories: Category[]
  /** Approved client reviews — populated on the detail endpoint only. */
  reviews?: PublicReview[]
  /** Picked advantages + visible portfolio + workflow — detail endpoint only. */
  advantages?: Advantage[]
  portfolio?: PortfolioItem[]
  workflow_steps?: WorkflowStep[]
  /** Distance from the requested point in metres — only on the nearby endpoint. */
  distance_m?: number
}

/** Top approved agents (ranked by profile completeness) for the home slider / marketplace. */
export async function fetchTopAgents(limit = 10, type?: 'agent' | 'designer'): Promise<PublicAgent[]> {
  const { data } = await api.get<ApiSuccess<PublicAgent[]>>('/api/v1/agents', {
    params: { limit, type },
  })

  return data.data
}

/** Approved designers — providers serving at least one designer category. */
export async function fetchDesigners(limit = 50): Promise<PublicAgent[]> {
  return fetchTopAgents(limit, 'designer')
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
