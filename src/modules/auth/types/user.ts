export type UserRole = 'client' | 'agent' | 'designer' | 'admin' | 'seller'

export type PersonType = 'individual' | 'legal_entity'

export type LegalEntityStatus = 'pending' | 'approved' | 'rejected'

/** Roles a user may pick for themselves (admin is granted out-of-band). */
export const SELF_SELECTABLE_ROLES = ['client', 'agent', 'designer', 'seller'] as const

export type SelectableRole = (typeof SELF_SELECTABLE_ROLES)[number]

export interface User {
  id: number
  telegram_id: number | null
  first_name: string
  last_name: string | null
  username: string | null
  email: string | null
  phone: string | null
  avatar_file_id: number | null
  avatar: string | null
  /** The currently active role — all gating is based on this. */
  role: UserRole
  /** Every role the user holds; switching between them is instant via PATCH /me/role. */
  roles: UserRole[]
  /** Timestamp the user chose their role at onboarding; null = not yet selected. */
  role_selected_at: string | null
  /** Effective legal nature (derived as legal_entity for agents/sellers); null = not asked. */
  person_type: PersonType | null
  /** Whether the legal-entity status is confirmed (agents/sellers are; self-declared isn't yet). */
  person_type_verified: boolean
  /** Raw self-declared value (client/designer); null = never chosen. */
  person_type_declared: PersonType | null
  /** Verification request state for the badge/CTA; null = nothing submitted. */
  legal_entity_status: LegalEntityStatus | null
  is_active: boolean
  created_at: string
  updated_at: string
}

/** Roles that represent a business presence in the marketplace (has / can have an agent profile). */
const BUSINESS_ROLES: readonly UserRole[] = ['agent', 'designer', 'seller']

/**
 * Coexistence matrix (mirrors the backend Role::conflictingRoles): `designer`
 * is a solo provider role, while `agent` + `seller` form the business group and
 * may coexist. Valid provider sets: {}, {agent}, {seller}, {agent, seller},
 * {designer}. Client is the universal base and conflicts with nothing.
 */
const ROLE_CONFLICTS: Record<SelectableRole, readonly SelectableRole[]> = {
  client: [],
  agent: ['designer'],
  seller: ['designer'],
  designer: ['agent', 'seller'],
}

/**
 * Whether the user may take on this role. Client and already-held roles are
 * always allowed (switching); acquiring a new provider role is blocked when it
 * conflicts with one the user already holds.
 */
export function canAcquireRole(user: Pick<User, 'role' | 'roles'>, role: SelectableRole): boolean {
  const held = user.roles?.length ? user.roles : [user.role]

  if (role === 'client' || held.includes(role)) return true

  return !ROLE_CONFLICTS[role].some(conflict => held.includes(conflict))
}

export function fullName(user: Pick<User, 'first_name' | 'last_name'>): string {
  return [user.first_name, user.last_name].filter(Boolean).join(' ').trim()
}

/** Active role is a marketplace provider role. */
export function isBusinessUser(user: Pick<User, 'role'>): boolean {
  return BUSINESS_ROLES.includes(user.role)
}

/** Held roles include any marketplace provider role (active or not). */
export function holdsBusinessRole(user: Pick<User, 'role' | 'roles'>): boolean {
  const held = user.roles?.length ? user.roles : [user.role]
  return held.some(role => BUSINESS_ROLES.includes(role))
}

/** Roles that self-declare their legal nature; agents/sellers are auto legal. */
export function roleChoosesPersonType(role: UserRole): boolean {
  return role === 'client' || role === 'designer'
}

export function roleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    client: 'Client',
    agent: 'Agent',
    designer: 'Designer',
    admin: 'Admin',
    seller: 'Seller',
  }

  return labels[role]
}
