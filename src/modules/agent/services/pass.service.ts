import { api } from '@/core/api/client'
import type { ApiSuccess } from '@/core/types/api'
import type { AgentPass, CardPaymentStart, PassHistoryItem, PassPurchaseResult } from '@/modules/agent/types/pass'

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

/** In-app card form, step 1 — the provider texts an SMS code to the cardholder. */
export async function startCardPayment(cardNumber: string, expiry: string): Promise<CardPaymentStart> {
  const { data } = await api.post<ApiSuccess<CardPaymentStart>>(
    '/api/v1/agent/pass/card',
    { card_number: cardNumber, expiry },
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
