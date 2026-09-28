import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { readPref, writePref } from '@/core/lib/cloud-prefs'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { isBusinessUser } from '@/modules/auth/types/user'

export type AppMode = 'client' | 'agent'

/**
 * The separate Agent workspace (/agent pages + the Client | Agent switch) is
 * off for now: everyone stays in the client shell, a saved "agent" choice is
 * ignored and /agent routes redirect home. Providers keep working through
 * /offers, /live-orders and /earnings. Flip to `true` to bring it back.
 */
export const AGENT_WORKSPACE_ENABLED = false

/** Route meta key a page sets to pin the workspace it belongs to. */
declare module 'vue-router' {
  interface RouteMeta {
    mode?: AppMode
    hideTabBar?: boolean
  }
}

/**
 * Client | Agent workspace. Purely a UI choice — the backend authorises by held
 * roles, never by this flag. Kept per user so a shared device does not leak one
 * account's last mode into another.
 */
export const useModeStore = defineStore('app-mode', () => {
  const auth = useAuthStore()
  const mode = ref<AppMode>('client')

  const storageKey = computed(() => (auth.user ? `adspace_mode_${auth.user.id}` : null))
  /** Only provider accounts get the Agent workspace (and the switch). */
  const canUseAgent = computed(() => AGENT_WORKSPACE_ENABLED && Boolean(auth.user && isBusinessUser(auth.user)))
  const isAgent = computed(() => canUseAgent.value && mode.value === 'agent')

  watch(storageKey, (key) => {
    mode.value = key && readPref(key) === 'agent' ? 'agent' : 'client'
  }, { immediate: true })

  function set(next: AppMode) {
    mode.value = next
    if (storageKey.value) writePref(storageKey.value, next)
  }

  return { mode, canUseAgent, isAgent, set }
})
