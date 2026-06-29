import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { hydratePref, readPref, writePref } from '@/core/lib/cloud-prefs'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { setUserRole, type SelectableRole } from '@/modules/onboarding/services/onboarding.service'

export const ONBOARDED_STORAGE_KEY = 'adspace_onboarded'

export type OnboardingStep = 'language' | 'terms' | 'role'

export const useOnboardingStore = defineStore('onboarding', () => {
  const auth = useAuthStore()

  const onboarded = ref(readPref(ONBOARDED_STORAGE_KEY) === '1')
  const step = ref<OnboardingStep>('language')
  const termsAccepted = ref(false)

  /**
   * Onboarding is required until the local flag is set. A returning user who already
   * selected a role on another device (durable `role_selected_at`) is treated as done.
   */
  const needsOnboarding = computed(() => {
    if (onboarded.value) return false
    if (auth.user?.role_selected_at) return false
    return true
  })

  function goTo(next: OnboardingStep) {
    step.value = next
  }

  function acceptTerms() {
    termsAccepted.value = true
    step.value = 'role'
  }

  /** Persist the chosen role to the backend and finish onboarding. */
  async function selectRole(role: SelectableRole): Promise<void> {
    // When authenticated, persist the role; in non-Telegram dev contexts without a
    // session we still let the user through so the flow is testable.
    if (auth.isAuthenticated) {
      const user = await setUserRole(role)
      auth.setUser(user)
    }

    complete()
  }

  function complete() {
    onboarded.value = true
    writePref(ONBOARDED_STORAGE_KEY, '1')
  }

  /** Rehydrate the flag from durable CloudStorage on startup. */
  async function hydrate() {
    const stored = await hydratePref(ONBOARDED_STORAGE_KEY)
    if (stored === '1') {
      onboarded.value = true
    }
  }

  return {
    onboarded,
    step,
    termsAccepted,
    needsOnboarding,
    goTo,
    acceptTerms,
    selectRole,
    complete,
    hydrate,
  }
})
