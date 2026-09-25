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

/** The legally approved client offer — same source as the downloadable PDF. */
export async function fetchPublicOffer(): Promise<PublicOffer> {
  const { data } = await api.get<ApiSuccess<PublicOffer>>('/api/v1/legal/public-offer', {
    skipErrorToast: true,
  })

  return data.data
}
