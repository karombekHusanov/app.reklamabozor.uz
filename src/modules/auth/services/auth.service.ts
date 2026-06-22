import { api } from '@/core/api/client'
import type { TelegramAuthPayload } from '@/core/lib/telegram-init'
import type { ApiSuccess, AuthResponse } from '@/core/types/api'
import type { User } from '@/modules/auth/types/user'

export async function authenticateWithTelegram(payload: TelegramAuthPayload): Promise<AuthResponse> {
  const { data } = await api.post<ApiSuccess<AuthResponse>>('/api/v1/auth/telegram', payload)

  return data.data
}

export async function fetchCurrentUser(): Promise<User> {
  const { data } = await api.get<ApiSuccess<User>>('/api/v1/auth/me')

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

export async function logout(): Promise<void> {
  await api.post('/api/v1/auth/logout')
}
