import { api } from '@/core/api/client'
import type { ApiSuccess } from '@/core/types/api'
import type { LegalEntityStatus } from '@/modules/auth/types/user'

export interface LegalEntityVerification {
  id: number
  inn: string
  company_name: string | null
  registration_certificate: string | null
  registration_certificate_file_id: number | null
  status: LegalEntityStatus
  rejection_reason: string | null
  verified_at: string | null
}

export interface SubmitLegalEntityPayload {
  inn: string
  company_name?: string | null
  registration_certificate_file_id?: number | null
}

/** Current verification request (GET /me/legal-entity) — null when none submitted. */
export async function fetchLegalEntity(): Promise<LegalEntityVerification | null> {
  const { data } = await api.get<ApiSuccess<LegalEntityVerification | null>>('/api/v1/me/legal-entity')
  return data.data
}

/** Submit (or resubmit) a verification request (POST /me/legal-entity). */
export async function submitLegalEntity(payload: SubmitLegalEntityPayload): Promise<LegalEntityVerification> {
  const { data } = await api.post<ApiSuccess<LegalEntityVerification>>('/api/v1/me/legal-entity', payload)
  return data.data
}
