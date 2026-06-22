export type AgentProfileStatus = 'pending' | 'approved' | 'rejected'

export interface Category {
  id: number
  name_uz: string
  name_ru: string
  type: 'agent' | 'designer'
  is_active: boolean
  sort_order: number
}

export interface AgentProfile {
  id: number

  // Phase 1 — verification / KYC.
  company_name: string
  legal_form: string | null
  inn: string | null
  director_name: string | null
  director_passport: string | null
  director_passport_file_id: number | null
  director_passport_file: string | null
  registration_certificate_file_id: number | null
  registration_certificate_file: string | null
  bank_name: string | null
  bank_account: string | null
  mfo: string | null
  phone: string

  // Phase 2 — client-facing presentation.
  company_logo_file_id: number | null
  company_logo: string | null
  bio: string | null
  linkedin_url: string | null
  website_url: string | null
  lat: string | number | null
  lng: string | number | null
  location_label: string | null
  results_text: string | null
  categories: Category[]
  completion_percent: number

  // Status.
  status: AgentProfileStatus
  rejection_reason: string | null
  approved_at: string | null
  created_at: string
  updated_at: string
}

/** Phase 1 payload — POST (apply) / PUT (resubmit) /api/v1/agent/profile. */
export interface AgentApplicationPayload {
  company_name: string
  legal_form: string
  inn: string
  director_name: string
  director_passport: string
  director_passport_file_id: number
  registration_certificate_file_id: number
  bank_name: string
  bank_account: string
  mfo: string
  phone: string
}

/** Phase 2 payload — PATCH /api/v1/agent/profile (approved profiles only). */
export interface AgentDetailsPayload {
  company_logo_file_id?: number | null
  bio?: string | null
  linkedin_url?: string | null
  website_url?: string | null
  lat?: number | null
  lng?: number | null
  location_label?: string | null
  results_text?: string | null
  category_ids?: number[]
}
