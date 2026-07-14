import axios from 'axios'
import { getApiErrorMessage } from '@/core/api/api-error'
import { useToast } from '@/core/composables/useToast'
import { currentToken } from '@/core/lib/token-storage'
import { absolutizeMediaUrls } from '@/core/lib/media'

declare module 'axios' {
  export interface AxiosRequestConfig {
    /** When true, the global error interceptor will not push a toast. */
    skipErrorToast?: boolean
  }
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  // Read from the durable in-memory mirror, not localStorage directly — Telegram's
  // WebView can wipe localStorage mid-session and silently drop the auth header.
  const token = currentToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

const toast = useToast()

/** Collapse identical API error toasts from parallel/retried requests. */
let lastToastMessage = ''
let lastToastAt = 0
const TOAST_DEDUPE_MS = 1500

api.interceptors.response.use(
  (response) => {
    // Resolve host-less "/storage/…" file paths to absolute URLs using the API base.
    if (response.data) {
      response.data = absolutizeMediaUrls(response.data)
    }
    return response
  },
  (error) => {
    // Session invalidation is owned by the auth store (it clears all token layers on
    // startup-restore failure or explicit logout). We intentionally do NOT wipe the token
    // here: a transient 401 must not strand a still-valid session by clearing the cache.

    if (!axios.isAxiosError(error) || error.config?.skipErrorToast) {
      return Promise.reject(error)
    }

    const message = getApiErrorMessage(error)
    const now = Date.now()
    if (message !== lastToastMessage || now - lastToastAt > TOAST_DEDUPE_MS) {
      lastToastMessage = message
      lastToastAt = now
      toast.error(message)
    }

    return Promise.reject(error)
  },
)
