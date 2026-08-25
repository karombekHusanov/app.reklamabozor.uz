export type UserRole = 'client' | 'agent' | 'designer' | 'admin' | 'seller'

export type PersonType = 'individual' | 'legal_entity'

export type LegalEntityStatus = 'pending' | 'approved' | 'rejected'

export type IdentityStatus = 'pending' | 'verified' | 'failed'

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
  /** Public offer version the user accepted; null = never accepted. */
  accepted_terms_version: string | null
  /** Public offer version currently in force. */
  terms_version: string
  /** True when the accepted offer version no longer matches the one in force. */
  needs_terms: boolean
  /** Effective legal nature (derived as legal_entity for agents/sellers); null = not asked. */
  person_type: PersonType | null
  /** Whether the legal-entity status is confirmed (agents/sellers are; self-declared isn't yet). */
  person_type_verified: boolean
  /** Raw self-declared value (client/designer); null = never chosen. */
  person_type_declared: PersonType | null
  /** Verification request state for the badge/CTA; null = nothing submitted. */
  legal_entity_status: LegalEntityStatus | null
  /** Whether the user passed optional MyID biometric identity verification. */
  identity_verified: boolean
  /** MyID verification state for the badge/CTA; null = never attempted. */
  identity_status: IdentityStatus | null
  /** Whether MyID is configured on the backend — the CTA shows only when true. */
  identity_verification_enabled: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

/** Roles that represent a business presence in the marketplace (has / can have an agent profile). */
const BUSINESS_ROLES: readonly UserRole[] = ['agent', 'designer', 'seller']

export function fullName(user: Pick<User, 'first_name' | 'last_name'>): string {
  return [user.first_name, user.last_name].filter(Boolean).join(' ').trim()
}

/**
 * Every role the user holds. `roles` is the source of rights (there is no
 * role switching); it may be null on legacy rows, so fall back to the single
 * `role`. Mirrors the backend User::allRoles().
 */
export function heldRoles(user: Pick<User, 'role' | 'roles'>): UserRole[] {
  return user.roles?.length ? user.roles : [user.role]
}

/** Whether the user holds a given role — the gate for sections/routes. */
export function userHasRole(user: Pick<User, 'role' | 'roles'>, role: UserRole): boolean {
  return heldRoles(user).includes(role)
}

/**
 * Whether the user holds any marketplace provider role (agent/designer/seller).
 * Drives whether the profile shows the provider surface. Reads the held `roles`
 * set, not the single active role.
 */
export function isBusinessUser(user: Pick<User, 'role' | 'roles'>): boolean {
  return heldRoles(user).some(role => BUSINESS_ROLES.includes(role))
}

/** @deprecated Use {@link isBusinessUser} — both now read the held roles set. */
export const holdsBusinessRole = isBusinessUser

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
