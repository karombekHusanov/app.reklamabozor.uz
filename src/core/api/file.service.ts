import { api } from '@/core/api/client'
import type { ApiSuccess, UploadedFile } from '@/core/types/api'

/**
 * Upload a single file to the generic file registry and get back its id + url.
 * Content-Type is left unset so the browser adds the multipart boundary itself
 * (the axios instance defaults to application/json, which would break the upload).
 */
export async function uploadFile(file: File): Promise<UploadedFile> {
  const form = new FormData()
  form.append('file', file)

  const { data } = await api.post<ApiSuccess<UploadedFile>>('/api/v1/file-upload', form, {
    headers: { 'Content-Type': undefined },
  })

  return data.data
}
