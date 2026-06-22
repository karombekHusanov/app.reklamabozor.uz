import axios from 'axios'
import { currentToken } from '@/core/lib/token-storage'

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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Session invalidation is owned by the auth store (it clears all token layers on
    // startup-restore failure or explicit logout). We intentionally do NOT wipe the token
    // here: a transient 401 must not strand a still-valid session by clearing the cache.
    return Promise.reject(error)
  },
)
