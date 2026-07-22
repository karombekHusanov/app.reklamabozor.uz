import { api } from '@/core/api/client'
import { currentToken } from '@/core/lib/token-storage'
import type { ApiSuccess, UploadedFile } from '@/core/types/api'

/**
 * Upload a single file to the generic file registry and get back its id + url.
 * Content-Type is left unset so the browser adds the multipart boundary itself
 * (the axios instance defaults to application/json, which would break the upload).
 *
 * This is the only request that replaces the whole `headers` object, so we also
 * pin the Bearer token here rather than trusting the interceptor to re-inject it
 * onto the override — production Telegram WebViews were seen sending this one
 * request unauthenticated (401) while every other call stayed logged in.
 */
export async function uploadFile(file: File): Promise<UploadedFile> {
  const form = new FormData()
  form.append('file', file)

  const token = currentToken()

  const { data } = await api.post<ApiSuccess<UploadedFile>>('/api/v1/file-upload', form, {
    headers: {
      'Content-Type': undefined,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  return data.data
}
