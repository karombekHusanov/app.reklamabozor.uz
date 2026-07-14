import { api } from '@/core/api/client'
import type { TelegramAuthPayload } from '@/core/lib/telegram-init'
import type { ApiSuccess, AuthResponse } from '@/core/types/api'
import type { SelectableRole, User } from '@/modules/auth/types/user'

type RequestOpts = { skipErrorToast?: boolean }

export async function authenticateWithTelegram(
  payload: TelegramAuthPayload,
  opts?: RequestOpts,
): Promise<AuthResponse> {
  const { data } = await api.post<ApiSuccess<AuthResponse>>(
    '/api/v1/auth/telegram',
    payload,
    { skipErrorToast: opts?.skipErrorToast },
  )

  return data.data
}

export async function fetchCurrentUser(opts?: RequestOpts): Promise<User> {
  const { data } = await api.get<ApiSuccess<User>>('/api/v1/auth/me', {
    skipErrorToast: opts?.skipErrorToast,
  })

  return data.data
}

/** Partial update of the current user (e.g. avatar, name) — PATCH /api/v1/me. */
export async function updateCurrentUser(payload: {
  first_name?: string
  last_name?: string | null
  avatar_file_id?: number | null
}): Promise<User> {
  const { data } = await api.patch<ApiSuccess<User>>('/api/v1/me', payload)

  return data.data
}

/**
 * Set the active role — PATCH /api/v1/me/role. The first call picks the onboarding role;
 * later calls switch to an already-held role or acquire a new self-selectable one.
 */
export async function setUserRole(role: SelectableRole): Promise<User> {
  const { data } = await api.patch<ApiSuccess<User>>('/api/v1/me/role', { role })

  return data.data
}

export async function logout(): Promise<void> {
  // Logout may 401 if the token is already gone — don't toast on cleanup.
  await api.post('/api/v1/auth/logout', undefined, { skipErrorToast: true })
}
