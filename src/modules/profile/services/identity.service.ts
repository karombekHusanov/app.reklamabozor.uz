import { api } from '@/core/api/client'
import type { ApiSuccess } from '@/core/types/api'
import type { IdentityStatus } from '@/modules/auth/types/user'

export interface IdentityVerification {
  id: number
  status: IdentityStatus
  verified_full_name: string | null
  pinfl: string | null
  pass_data: string | null
  comparison_value: number | null
  failure_code: number | null
  failure_note: string | null
  verified_at: string | null
}

/** Current MyID verification record (GET /me/identity) — null when never attempted. */
export async function fetchIdentity(): Promise<IdentityVerification | null> {
  const { data } = await api.get<ApiSuccess<IdentityVerification | null>>('/api/v1/me/identity')
  return data.data
}

/**
 * Start the redirect (fallback) flow: the backend mints a CSRF state and returns
 * the MyID authorization URL. The mini app opens it externally; the backend's
 * public callback grants the badge, and the app polls GET /me/identity.
 */
export async function authorizeIdentity(): Promise<string> {
  const { data } = await api.post<ApiSuccess<{ authorization_url: string }>>('/api/v1/me/identity/authorize')
  return data.data.authorization_url
}

/** Dev/test only: grant a simulated verified identity without calling MyID. */
export async function simulateIdentity(): Promise<IdentityVerification> {
  const { data } = await api.post<ApiSuccess<IdentityVerification>>('/api/v1/me/identity/simulate')
  return data.data
}
