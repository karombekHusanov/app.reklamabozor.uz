import { api } from '@/core/api/client'
import type { ApiSuccess } from '@/core/types/api'
import type { User, UserRole } from '@/modules/auth/types/user'

/** Roles a user may pick for themselves at onboarding (admin is granted out-of-band). */
export type SelectableRole = Extract<UserRole, 'client' | 'agent' | 'designer' | 'seller'>

/** Set the account role once, during onboarding — PATCH /api/v1/me/role. */
export async function setUserRole(role: SelectableRole): Promise<User> {
  const { data } = await api.patch<ApiSuccess<User>>('/api/v1/me/role', { role })

  return data.data
}
