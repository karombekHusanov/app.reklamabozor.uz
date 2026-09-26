import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { setUserPersonType } from '@/modules/auth/services/auth.service'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import type { PersonType } from '@/modules/auth/types/user'

export type OnboardingStep = 'language' | 'terms' | 'person_type' | 'intent'

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

  /**
   * Record acceptance of the public offer (versioned) and advance to the role
   * step. In non-Telegram dev contexts without a session we still advance.
   */
  async function acceptTerms(): Promise<void> {
    if (auth.isAuthenticated) {
      const user = await auth.acceptTerms()
      auth.setUser(user)
    }

    termsAccepted.value = true
    // No role step — everyone starts as a client. Keep the flow open through
    // the final person_type step (setUserPersonType stamps role_selected_at,
    // which would otherwise flip needsOnboarding mid-flow).
    active.value = true
    step.value = 'person_type'
  }

  /**
   * Persist the self-declared legal nature, then ask what brings the user
   * here (client vs agency). That last step is front-end only — no role is
   * changed; everyone continues as a client.
   */
  async function selectPersonType(personType: PersonType): Promise<void> {
    if (auth.isAuthenticated) {
      const user = await setUserPersonType(personType)
      auth.setUser(user)
    }

    active.value = true
    step.value = 'intent'
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
    selectPersonType,
    complete,
  }
})
