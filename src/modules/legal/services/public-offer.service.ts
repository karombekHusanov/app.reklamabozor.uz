import { api } from '@/core/api/client'
import type { ApiSuccess } from '@/core/types/api'

export interface PublicOfferClause {
  label: string
  text: string
}

/** `uz-Cyrl` = the binding Uzbek Cyrillic original; the rest are informational translations. */
export type PublicOfferLocale = 'uz-Cyrl' | 'uz' | 'ru' | 'en'

export interface PublicOffer {
  title: string
  version: string
  locale: PublicOfferLocale
  is_original: boolean
  original_locale: PublicOfferLocale
  available_locales: PublicOfferLocale[]
  /** "Translation for information; the Uzbek text prevails" — null on the original. */
  translation_notice: string | null
  /** PDF in the same language as the text. */
  pdf_url: string
  original_pdf_url: string
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

/**
 * A legally approved offer in the requested language — same source as the
 * downloadable PDF (whose `pdf_url` already carries the same locale).
 */
export async function fetchPublicOffer(
  kind: PublicOfferKind = 'client',
  locale: PublicOfferLocale = 'uz',
): Promise<PublicOffer> {
  const { data } = await api.get<ApiSuccess<PublicOffer>>(OFFER_PATHS[kind], {
    params: { locale },
    skipErrorToast: true,
  })

  return data.data
}
