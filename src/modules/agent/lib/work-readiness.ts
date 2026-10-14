import type { AgentProfile } from '@/modules/agent/types/agent'

/**
 * Before an approved executor may start working (send an otklik), the profile
 * must say WHAT they do and WHERE: at least one service category and a pin on
 * the map. Either legal track. Not-yet-approved profiles are out of scope —
 * approval itself gates them.
 */
export interface WorkReadiness {
  /** Approved and complete: may respond to requests. */
  ready: boolean
  /** Approved but still missing something below. */
  blocked: boolean
  missingCategories: boolean
  missingLocation: boolean
  /** The profile-edit tab to open first (`?tab=`). */
  firstTab: 'categories' | 'links' | null
}

export function workReadiness(profile: AgentProfile | null | undefined): WorkReadiness {
  const approved = profile?.status === 'approved'
  const missingCategories = approved && (profile?.categories?.length ?? 0) === 0
  const missingLocation = approved && (profile?.lat == null || profile?.lng == null || profile.lat === '' || profile.lng === '')
  const blocked = missingCategories || missingLocation

  return {
    ready: approved && !blocked,
    blocked,
    missingCategories,
    missingLocation,
    firstTab: missingCategories ? 'categories' : missingLocation ? 'links' : null,
  }
}

/** Profile-edit link that opens straight on the first missing section. */
export function workReadinessEditPath(readiness: WorkReadiness): string {
  return readiness.firstTab ? `/profile/edit?tab=${readiness.firstTab}` : '/profile/edit'
}
