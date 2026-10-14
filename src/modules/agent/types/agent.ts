export type AgentProfileStatus = 'pending' | 'approved' | 'rejected'

export type AgentContractStatus = 'awaiting_signature' | 'under_review' | 'approved' | 'rejected'

/** Platform↔agent agreement: generated from KYC, signed offline, re-uploaded. */
export interface AgentContract {
  status: AgentContractStatus | null
  version: string | null
  /** Generated agreement PDF (download → sign → upload). */
  file: string | null
  /** The agent's uploaded signed scan. */
  signed_file: string | null
  rejection_reason: string | null
  generated_at: string | null
  signed_at: string | null
  approved: boolean
}

/** Admin-managed catalog entry a provider can pick as an "advantage". */
export interface Advantage {
  id: number
  name_uz: string
  name_ru: string
  hint_uz: string | null
  hint_ru: string | null
  /** Lucide icon key (e.g. "timer", "shield-check"). */
  icon: string
}

/** Uploaded file attached to a portfolio block. */
export interface PortfolioFile {
  id: number
  url: string
  original_name: string
  mime_type: string
  size: number
}

/** One "qilgan ishimiz" portfolio card. */
export interface PortfolioItem {
  id: number
  title: string
  description: string | null
  link_url: string | null
  /** Cover image URL (first gallery image). */
  image: string | null
  images: PortfolioFile[]
  attachments: PortfolioFile[]
  sort_order: number
  /** True when moderation took the item down (owner-only surface). */
  is_hidden: boolean
}

/** Editable "ish jarayoni" step. */
export interface WorkflowStep {
  title: string
  description?: string | null
}

export interface Category {
  id: number
  name_uz: string
  name_ru: string
  type: 'agent' | 'designer'
  /** Admin-uploaded illustration; null = fall back to the generated icon. */
  image?: string | null
  is_active: boolean
  is_other?: boolean
  sort_order: number
}

/**
 * Executor ("ijrochi") legal track: `agent` = legal entity (full KYC, Tender),
 * `individual` = jismoniy shaxs (passport + selfie, Tezkor only).
 */
export type ProviderType = 'agent' | 'individual'

export type AgentProfileUpgradeStatus = 'pending' | 'approved' | 'rejected'

/** Summary of the latest individual → legal-entity upgrade request. */
export interface AgentProfileUpgradeSummary {
  id: number
  status: AgentProfileUpgradeStatus
  rejection_reason: string | null
  submitted_at: string
  reviewed_at: string | null
}

export interface AgentProfile {
  id: number
  display_name: string
  provider_type: ProviderType
  is_individual: boolean

  // Phase 1 — verification / KYC.
  company_name: string
  legal_form: string | null
  inn: string | null
  legal_address: string | null
  director_name: string | null
  director_pinfl: string | null
  director_position: string | null
  director_passport: string | null
  director_passport_file_id: number | null
  director_passport_file: string | null
  registration_certificate_file_id: number | null
  registration_certificate_file: string | null
  bank_name: string | null
  bank_account: string | null
  mfo: string | null
  phone: string
  /** Individual track: selfie scan (light KYC). */
  selfie_file_id: number | null
  selfie: string | null
  /** Optional second contact (phone / Telegram). */
  alt_contact: string | null

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
  advantages: Advantage[]
  portfolio: PortfolioItem[]
  workflow_steps: WorkflowStep[]
  completion_percent: number

  // Status.
  status: AgentProfileStatus
  rejection_reason: string | null
  approved_at: string | null
  /** Platform agreement (legal entities only; null for individuals). */
  contract?: AgentContract | null
  /** Agency partnership offer acceptance (legal entities only; null for individuals). */
  offer?: AgentOfferAcceptance | null
  /** Individual → legal-entity upgrade: whether a request may be sent + the latest one. */
  upgrade?: {
    can_request: boolean
    latest: AgentProfileUpgradeSummary | null
  }
  created_at: string
  updated_at: string
}

export interface AgentOfferAcceptance {
  /** Current offer version the agent must accept. */
  version: string
  accepted_version: string | null
  accepted_at: string | null
  needs_acceptance: boolean
}

/** Phase 1 payload — POST (apply) / PUT (resubmit) /api/v1/agent/profile. */
export interface AgentApplicationPayload {
  company_name: string
  legal_form: string
  inn: string
  legal_address: string
  director_name: string
  director_pinfl: string
  director_position: string | null
  director_passport: string
  director_passport_file_id: number
  registration_certificate_file_id: number
  bank_name: string
  bank_account: string
  mfo: string
  phone: string
  /** Click-wrap acceptance of the agency partnership offer — required. */
  accept_offer: true
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
  advantage_ids?: number[]
  workflow_steps?: WorkflowStep[] | null
}

/** POST (apply) / PUT (resubmit) /api/v1/individual/profile — light KYC. */
export interface IndividualApplicationPayload {
  full_name: string
  alt_contact: string | null
  passport_file_id: number
  selfie_file_id: number
  category_ids: number[]
}

/** POST /agent/portfolio payload. */
export interface PortfolioItemPayload {
  image_file_ids: number[]
  attachment_file_ids?: number[]
  title: string
  description?: string | null
  link_url?: string | null
}

/** PATCH /agent/portfolio/{id} payload. */
export interface PortfolioItemUpdatePayload {
  image_file_ids?: number[]
  attachment_file_ids?: number[] | null
  title?: string
  description?: string | null
  link_url?: string | null
}
