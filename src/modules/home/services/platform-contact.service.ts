import { api } from '@/core/api/client'
import type { ApiSuccess } from '@/core/types/api'

export interface PlatformContact {
  phone: string | null
  work_hours: string | null
  email: string | null
}

/** Public platform contact details for the home trust row. */
export async function fetchPlatformContact(): Promise<PlatformContact> {
  const { data } = await api.get<ApiSuccess<PlatformContact>>('/api/v1/platform-contact')

  return data.data
}
