import { api } from '@/core/api/client'
import type { ApiSuccess } from '@/core/types/api'
import type {
  AgentApplicationPayload,
  AgentDetailsPayload,
  AgentProfile,
  Category,
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
