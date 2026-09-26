import { api } from '@/core/api/client'
import type { ApiSuccess } from '@/core/types/api'

export interface PublicOfferClause {
  label: string
  text: string
}

export interface PublicOffer {
  title: string
  version: string
  pdf_url: string
  sections: { title: string, clauses: PublicOfferClause[] }[]
  requisites_title: string
  requisites: { label: string, value: string }[]
}

/** `client` = onboarding offer for everyone; `agent` = agency partnership offer. */
export type PublicOfferKind = 'client' | 'agent'

const OFFER_PATHS: Record<PublicOfferKind, string> = {
  client: '/api/v1/legal/public-offer',
  agent: '/api/v1/legal/agent-offer',
}

/** A legally approved offer — same source as the downloadable PDF. */
export async function fetchPublicOffer(kind: PublicOfferKind = 'client'): Promise<PublicOffer> {
  const { data } = await api.get<ApiSuccess<PublicOffer>>(OFFER_PATHS[kind], {
    skipErrorToast: true,
  })

  return data.data
}
