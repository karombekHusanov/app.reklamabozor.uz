import { api } from '@/core/api/client'
import type { ApiSuccess } from '@/core/types/api'
import type { AgentPass, CardInput, CardPaymentStart, PassHistoryItem, PassPurchaseResult, SavedCard } from '@/modules/agent/types/pass'

export async function fetchPass(): Promise<AgentPass> {
  const { data } = await api.get<ApiSuccess<AgentPass>>('/api/v1/agent/pass', { skipErrorToast: true })
  return data.data
}

export async function purchasePass(): Promise<PassPurchaseResult> {
  const { data } = await api.post<ApiSuccess<PassPurchaseResult>>(
    '/api/v1/agent/pass/purchase',
    {},
    { skipErrorToast: true },
  )
  return data.data
}

export async function fetchPassHistory(): Promise<PassHistoryItem[]> {
  const { data } = await api.get<ApiSuccess<{ items: PassHistoryItem[] }>>(
    '/api/v1/agent/pass/history',
    { skipErrorToast: true },
  )
  return data.data.items
}

/**
 * In-app card form, step 1 — a typed card gets an SMS code; a saved card is
 * charged at once (`requires_otp=false`).
 */
export async function startCardPayment(card: CardInput): Promise<CardPaymentStart> {
  const { data } = await api.post<ApiSuccess<CardPaymentStart>>(
    '/api/v1/agent/pass/card',
    card,
    { skipErrorToast: true },
  )
  return data.data
}

/** Step 2 — the SMS code. `summary.active` is true once the money is taken. */
export async function confirmCardPayment(
  paymentRef: string,
  otp: string,
): Promise<{ status: 'pending' | 'success' | 'failed', summary: AgentPass }> {
  const { data } = await api.post<ApiSuccess<{ status: 'pending' | 'success' | 'failed', summary: AgentPass }>>(
    `/api/v1/agent/pass/card/${paymentRef}/confirm`,
    { otp },
    { skipErrorToast: true },
  )
  return data.data
}

/** Wallet top-up from the in-app card form (per-otklik mode); confirm with {@link confirmCardPayment}. */
export async function startWalletTopup(amountSom: number, card: CardInput): Promise<CardPaymentStart> {
  const { data } = await api.post<ApiSuccess<CardPaymentStart>>(
    '/api/v1/agent/wallet/card',
    { amount_som: amountSom, ...card },
    { skipErrorToast: true },
  )
  return data.data
}

/** Cards bound at the provider (masked). */
export async function fetchSavedCards(): Promise<SavedCard[]> {
  const { data } = await api.get<ApiSuccess<{ items: SavedCard[] }>>('/api/v1/agent/cards', { skipErrorToast: true })
  return data.data.items
}

export async function removeSavedCard(id: number): Promise<void> {
  await api.delete(`/api/v1/agent/cards/${id}`, { skipErrorToast: true })
}
