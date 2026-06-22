import { ref } from 'vue'
import { uploadFile } from '@/core/api/file.service'
import { getApiErrorMessage } from '@/core/api/api-error'
import type { UploadedFile } from '@/core/types/api'

/** Max upload size in bytes — mirrors the backend FILES_MAX_SIZE_KB (5 MB). */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

/**
 * Stateful helper for uploading a file: tracks the in-flight + error state and
 * validates size client-side before hitting the network. Returned by the
 * FileUpload / ImageUpload components.
 */
export function useFileUpload() {
  const isUploading = ref(false)
  const error = ref<string | null>(null)

  async function upload(file: File): Promise<UploadedFile | null> {
    error.value = null

    if (file.size > MAX_UPLOAD_BYTES) {
      error.value = 'File is too large (max 5 MB).'
      return null
    }

    isUploading.value = true

    try {
      return await uploadFile(file)
    }
    catch (e) {
      error.value = getApiErrorMessage(e)
      return null
    }
    finally {
      isUploading.value = false
    }
  }

  return { isUploading, error, upload }
}
