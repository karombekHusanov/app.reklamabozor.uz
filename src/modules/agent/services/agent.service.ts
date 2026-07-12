import { api } from '@/core/api/client'
import type { ApiSuccess } from '@/core/types/api'
import type {
  Advantage,
  AgentApplicationPayload,
  AgentDetailsPayload,
  AgentProfile,
  Category,
  PortfolioItem,
  PortfolioItemPayload,
  PortfolioItemUpdatePayload,
} from '@/modules/agent/types/agent'

// All active categories — a provider may offer advertising (agent) and/or design.
export async function fetchAgentCategories(): Promise<Category[]> {
  const { data } = await api.get<ApiSuccess<Category[]>>('/api/v1/categories')

  return data.data
}

export async function fetchMyAgentProfile(): Promise<AgentProfile | null> {
  const { data } = await api.get<ApiSuccess<AgentProfile | null>>('/api/v1/agent/profile')

  return data.data
}

/** Phase 1 — submit a brand-new verification application. */
export async function submitAgentApplication(
  payload: AgentApplicationPayload,
): Promise<AgentProfile> {
  const { data } = await api.post<ApiSuccess<AgentProfile>>('/api/v1/agent/profile', payload)

  return data.data
}

/** Phase 1 — resubmit / edit a pending or rejected application. */
export async function resubmitAgentApplication(
  payload: AgentApplicationPayload,
): Promise<AgentProfile> {
  const { data } = await api.put<ApiSuccess<AgentProfile>>('/api/v1/agent/profile', payload)

  return data.data
}

/** Phase 2 — update the client-facing presentation (approved profiles only). */
export async function updateAgentDetails(
  payload: AgentDetailsPayload,
): Promise<AgentProfile> {
  const { data } = await api.patch<ApiSuccess<AgentProfile>>('/api/v1/agent/profile', payload)

  return data.data
}

// ---- Advantages catalog + portfolio (approved providers) ----

/** Active advantages catalog the provider picks from. */
export async function fetchAdvantagesCatalog(): Promise<Advantage[]> {
  const { data } = await api.get<ApiSuccess<Advantage[]>>('/api/v1/advantages')

  return data.data
}

/** The caller's own portfolio, hidden (taken-down) items included. */
export async function fetchMyPortfolio(): Promise<PortfolioItem[]> {
  const { data } = await api.get<ApiSuccess<PortfolioItem[]>>('/api/v1/agent/portfolio')

  return data.data
}

export async function addPortfolioItem(payload: PortfolioItemPayload): Promise<PortfolioItem> {
  const { data } = await api.post<ApiSuccess<PortfolioItem>>('/api/v1/agent/portfolio', payload)

  return data.data
}

export async function updatePortfolioItem(
  id: number,
  payload: PortfolioItemUpdatePayload,
): Promise<PortfolioItem> {
  const { data } = await api.patch<ApiSuccess<PortfolioItem>>(`/api/v1/agent/portfolio/${id}`, payload)

  return data.data
}

export async function deletePortfolioItem(id: number): Promise<void> {
  await api.delete(`/api/v1/agent/portfolio/${id}`)
}
