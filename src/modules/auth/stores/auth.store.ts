import {
  authenticateWithTelegram,
  fetchCurrentUser,
  logout as logoutRequest,
  setUserRole,
  updateCurrentUser,
} from '@/modules/auth/services/auth.service'
import { getApiErrorMessage } from '@/core/api/api-error'
import { clearToken, hydrateToken, persistToken, readToken } from '@/core/lib/token-storage'
import { isInsideTelegram, resolveTelegramUser, type TelegramAuthPayload } from '@/core/lib/telegram-init'
import type { SelectableRole, User } from '@/modules/auth/types/user'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'error'

let bootstrapPromise: Promise<boolean> | null = null

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(readToken())
  const status = ref<AuthStatus>('idle')
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => status.value === 'authenticated' && user.value !== null)
  const isLoading = computed(() => status.value === 'loading')
  /** Telegram users must share their phone before using the app. */
  const needsPhone = computed(() => isAuthenticated.value && !user.value?.phone)

  function setSession(nextUser: User, nextToken: string) {
    user.value = nextUser
    token.value = nextToken
    persistToken(nextToken)
    status.value = 'authenticated'
    error.value = null
  }

  function setUser(nextUser: User) {
    user.value = nextUser
  }

  function clearSession() {
    user.value = null
    token.value = null
    clearToken()
    status.value = 'idle'
  }

  async function loginWithTelegram(payload: TelegramAuthPayload, options?: { silent?: boolean }) {
    status.value = 'loading'

    if (!options?.silent) {
      error.value = null
    }

    try {
      const response = await authenticateWithTelegram(payload, {
        skipErrorToast: options?.silent,
      })
      setSession(response.user, response.token)
    } catch (e) {
      if (options?.silent) {
        clearSession()
        status.value = 'idle'
      } else {
        status.value = 'error'
        error.value = getApiErrorMessage(e)
        clearSession()
      }

      throw e
    }
  }

  /** Persist a new avatar (already uploaded to the file registry) and update the session user. */
  async function saveAvatar(fileId: number | null): Promise<boolean> {
    try {
      user.value = await updateCurrentUser({ avatar_file_id: fileId })
      return true
    }
    catch (e) {
      error.value = getApiErrorMessage(e)
      return false
    }
  }

  /** Edit the user's name (phone is not editable — it comes from Telegram). */
  async function updateProfile(payload: { first_name?: string, last_name?: string | null }): Promise<boolean> {
    error.value = null
    try {
      user.value = await updateCurrentUser(payload)
      return true
    }
    catch (e) {
      error.value = getApiErrorMessage(e)
      return false
    }
  }

  /** Switch the active role or acquire a new self-selectable one; the session user is refreshed from the response. */
  async function switchRole(role: SelectableRole): Promise<boolean> {
    error.value = null
    try {
      user.value = await setUserRole(role)
      return true
    }
    catch (e) {
      error.value = getApiErrorMessage(e)
      return false
    }
  }

  /** Re-fetch the current user (e.g. to pick up a phone saved by the bot webhook). */
  async function refreshUser(): Promise<User | null> {
    if (!token.value) {
      return null
    }

    try {
      user.value = await fetchCurrentUser({ skipErrorToast: true })
      return user.value
    }
    catch {
      return null
    }
  }

  async function restoreSession() {
    if (!token.value) {
      status.value = 'idle'
      return false
    }

    status.value = 'loading'
    error.value = null

    try {
      user.value = await fetchCurrentUser({ skipErrorToast: true })
      status.value = 'authenticated'
      return true
    } catch {
      clearSession()
      return false
    }
  }

  async function logout() {
    try {
      if (token.value) {
        await logoutRequest()
      }
    } finally {
      clearSession()
      bootstrapPromise = null
    }
  }

  async function bootstrapTelegramAuth(): Promise<boolean> {
    if (bootstrapPromise) {
      return bootstrapPromise
    }

    bootstrapPromise = (async () => {
      if (isAuthenticated.value) {
        return true
      }

      // Outside Telegram (e.g. local browser dev with a manually injected token) there is no
      // Telegram account to authenticate against — restore the session from the stored token.
      if (!isInsideTelegram()) {
        if (!token.value) {
          token.value = await hydrateToken()
        }

        return token.value ? await restoreSession() : false
      }

      // Inside Telegram we authenticate straight from the current launch's initData every time.
      // The token is always derived from the active Telegram account, so there is no need to
      // persist / restore it or reconcile account identity. This also removes the multi-account
      // hazard where a token cached in the shared WebView storage leaks into another account.
      // Drop any device-shared token first so a stale one can't be sent before login resolves.
      if (token.value) {
        clearSession()
      }

      const telegramUser = await resolveTelegramUser()

      if (!telegramUser) {
        if (import.meta.env.DEV) {
          console.warn('[auth] Telegram user not available — skipping auto login.')
        }

        return false
      }

      const attempts = 2

      for (let attempt = 0; attempt < attempts; attempt++) {
        try {
          await loginWithTelegram(telegramUser, { silent: true })
          return true
        } catch (loginError) {
          if (import.meta.env.DEV) {
            console.warn(`[auth] Auto login attempt ${attempt + 1} failed:`, getApiErrorMessage(loginError))
          }

          if (attempt < attempts - 1) {
            await new Promise((resolve) => setTimeout(resolve, 600))
          }
        }
      }

      return false
    })()

    return bootstrapPromise
  }

  return {
    user,
    token,
    status,
    error,
    isAuthenticated,
    isLoading,
    needsPhone,
    loginWithTelegram,
    restoreSession,
    refreshUser,
    saveAvatar,
    updateProfile,
    switchRole,
    setUser,
    logout,
    clearSession,
    bootstrapTelegramAuth,
  }
})
