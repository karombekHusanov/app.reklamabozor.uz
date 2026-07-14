import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { setUserRole } from '@/modules/auth/services/auth.service'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import type { SelectableRole } from '@/modules/auth/types/user'

export type OnboardingStep = 'language' | 'terms' | 'role'

export const useOnboardingStore = defineStore('onboarding', () => {
  const auth = useAuthStore()

  // Session-only completion flag. Nothing is persisted to device storage: the WebView
  // (localStorage / CloudStorage on older clients) is shared between Telegram accounts
  // on the same device, so a stored flag would leak across accounts and hide
  // onboarding from users who never completed it.
  const completed = ref(false)
  const step = ref<OnboardingStep>('language')
  const termsAccepted = ref(false)

  /**
   * Onboarding is driven purely by the backend: a user whose /me response has no
   * `role_selected_at` has never picked a role and must onboard. Each Telegram
   * account is therefore evaluated independently, regardless of the device.
   */
  const needsOnboarding = computed(() => {
    if (completed.value) return false
    if (!auth.isAuthenticated || !auth.user) return false
    return auth.user.role_selected_at === null
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
    completed.value = true
  }

  return {
    step,
    termsAccepted,
    needsOnboarding,
    goTo,
    acceptTerms,
    selectRole,
    complete,
  }
})
