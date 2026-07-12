import type { Router } from 'vue-router'
import { ROUTES } from '@/modules/shell/constants/routes'

/** True when Vue Router recorded a prior in-app route (not a Telegram/deep-link entry). */
export function hasInAppBackNavigation(): boolean {
  const back = window.history.state?.back
  return typeof back === 'string' && back.length > 0
}

/** Pop in-app history, or fall back to home when opened via external deep link. */
export function navigateBack(router: Router, fallback = ROUTES.home): void {
  if (hasInAppBackNavigation()) {
    router.back()
    return
  }

  void router.replace(fallback)
}
