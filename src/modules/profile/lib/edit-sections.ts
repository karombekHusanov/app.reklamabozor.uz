import type { AgentProfile } from '@/modules/agent/types/agent'

/**
 * Executor profile editing is a list of sections (hub) — each one opens on its
 * own page (`/profile/edit/:section`) and saves only its own fields
 * (`PATCH /agent/profile` is partial).
 */
export const EDIT_SECTIONS = [
  'brand',
  'categories',
  'location',
  'portfolio',
  'results',
  'advantages',
  'workflow',
  'requisites',
] as const

export type EditSection = typeof EDIT_SECTIONS[number]

export function isEditSection(value: unknown): value is EditSection {
  return typeof value === 'string' && (EDIT_SECTIONS as readonly string[]).includes(value)
}

/** Legacy `?tab=` keys from the old tabbed form. */
export function sectionFromLegacyTab(tab: unknown): EditSection | null {
  if (tab === 'links') return 'location'
  if (tab === 'verification') return 'requisites'
  return isEditSection(tab) ? tab : null
}

export function editSectionPath(section: EditSection): string {
  return `/profile/edit/${section}`
}

/** Sections a client sees on the public profile (requisites stay private). */
export type FillableSection = Exclude<EditSection, 'requisites'>

export const FILLABLE_SECTIONS: FillableSection[] = [
  'brand',
  'categories',
  'location',
  'portfolio',
  'results',
  'advantages',
  'workflow',
]

/** Required before the executor may respond to requests (work readiness). */
export const REQUIRED_SECTIONS: FillableSection[] = ['categories', 'location']

export function isSectionFilled(profile: AgentProfile, section: FillableSection): boolean {
  switch (section) {
    case 'brand':
      return Boolean(profile.company_logo_file_id) && Boolean(profile.bio?.trim())
    case 'categories':
      return profile.categories.length > 0
    case 'location':
      return profile.lat != null && profile.lat !== '' && profile.lng != null && profile.lng !== ''
    case 'portfolio':
      return (profile.portfolio?.length ?? 0) > 0
    case 'results':
      return Boolean(profile.results_text?.trim())
    case 'advantages':
      return (profile.advantages?.length ?? 0) > 0
    case 'workflow':
      return (profile.workflow_steps?.length ?? 0) > 0
  }
}
