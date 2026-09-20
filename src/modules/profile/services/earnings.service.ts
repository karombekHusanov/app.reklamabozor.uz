import { api } from '@/core/api/client'
import type { ApiSuccess } from '@/core/types/api'
import type { EarningsResponse } from '@/modules/profile/types/earnings'

/** The agent's escrow payouts + withdrawable balance. */
export async function fetchEarnings(): Promise<EarningsResponse> {
  const { data } = await api.get<ApiSuccess<EarningsResponse>>('/api/v1/agent/payouts')

  return data.data
}
