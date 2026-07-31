import { api } from '@/core/api/client'
import type { ApiSuccess } from '@/core/types/api'
import type { EarningsResponse, Withdrawal } from '@/modules/profile/types/earnings'

/** The agent's escrow payouts + withdrawable balance. */
export async function fetchEarnings(): Promise<EarningsResponse> {
  const { data } = await api.get<ApiSuccess<EarningsResponse>>('/api/v1/agent/payouts')

  return data.data
}

/** Start a cash-out of the available balance; returns the hosted card form. */
export async function startWithdrawal(): Promise<Withdrawal> {
  const { data } = await api.post<ApiSuccess<Withdrawal>>('/api/v1/agent/withdrawals')

  return data.data
}

/** Poll a withdrawal; advances card_pending → otp_required once the card is bound. */
export async function fetchWithdrawal(id: number): Promise<Withdrawal> {
  const { data } = await api.get<ApiSuccess<Withdrawal>>(`/api/v1/agent/withdrawals/${id}`)

  return data.data
}

/** Confirm the withdrawal with the OTP the cardholder received. */
export async function confirmWithdrawal(id: number, otp: string): Promise<Withdrawal> {
  const { data } = await api.post<ApiSuccess<Withdrawal>>(
    `/api/v1/agent/withdrawals/${id}/confirm`,
    { otp },
  )

  return data.data
}

/** Abandon an in-flight withdrawal, returning funds to the available balance. */
export async function cancelWithdrawal(id: number): Promise<Withdrawal> {
  const { data } = await api.post<ApiSuccess<Withdrawal>>(`/api/v1/agent/withdrawals/${id}/cancel`)

  return data.data
}
