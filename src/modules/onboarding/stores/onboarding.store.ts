import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { setUserPersonType, setUserRole } from '@/modules/auth/services/auth.service'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import type { PersonType, SelectableRole } from '@/modules/auth/types/user'

export type OnboardingStep = 'language' | 'terms' | 'role' | 'person_type'

export const useOnboardingStore = defineStore('onboarding', () => {
  const auth = useAuthStore()

  // Session-only completion flag. Nothing is persisted to device storage: the WebView
  // (localStorage / CloudStorage on older clients) is shared between Telegram accounts
  // on the same device, so a stored flag would leak across accounts and hide
  // onboarding from users who never completed it.
  const completed = ref(false)
  const step = ref<OnboardingStep>('language')
  const termsAccepted = ref(false)
  // Latches true once the flow is under way, so onboarding stays open through
  // the post-role person_type step (selecting a role sets role_selected_at,
  // which would otherwise flip needsOnboarding to false mid-flow).
  const active = ref(false)

  /**
   * Onboarding is driven purely by the backend: a user whose /me response has no
   * `role_selected_at` has never picked a role and must onboard. Each Telegram
   * account is therefore evaluated independently, regardless of the device.
   */
  const needsOnboarding = computed(() => {
    if (completed.value) return false
    if (!auth.isAuthenticated || !auth.user) return false
    if (auth.user.role_selected_at === null) return true
    // Role saved but the flow is still running (person_type step).
    return active.value
  })

  function goTo(next: OnboardingStep) {
    step.value = next
  }

  function acceptTerms() {
    termsAccepted.value = true
    step.value = 'role'
  }

  /**
   * Persist the chosen role. Does NOT finish onboarding — the flow then asks
   * client/designer users for their person type; agents/sellers skip straight
   * to completion (their legal nature is fixed by the role).
   */
  async function selectRole(role: SelectableRole): Promise<void> {
    // Keep the flow open after role_selected_at is set (person_type step).
    active.value = true

    // When authenticated, persist the role; in non-Telegram dev contexts without a
    // session we still let the user through so the flow is testable.
    if (auth.isAuthenticated) {
      const user = await setUserRole(role)
      auth.setUser(user)
    }
  }

  /** Persist the self-declared legal nature and finish onboarding. */
  async function selectPersonType(personType: PersonType): Promise<void> {
    if (auth.isAuthenticated) {
      const user = await setUserPersonType(personType)
      auth.setUser(user)
    }

    complete()
  }

  function complete() {
    completed.value = true
    active.value = false
  }

  return {
    step,
    termsAccepted,
    needsOnboarding,
    goTo,
    acceptTerms,
    selectRole,
    selectPersonType,
    complete,
  }
})
