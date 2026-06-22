export type UserRole = 'client' | 'agent' | 'designer' | 'admin' | 'seller'

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
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

/** Roles that represent a business presence in the marketplace (has / can have an agent profile). */
const BUSINESS_ROLES: readonly UserRole[] = ['agent', 'designer', 'seller']

export function fullName(user: Pick<User, 'first_name' | 'last_name'>): string {
  return [user.first_name, user.last_name].filter(Boolean).join(' ').trim()
}

export function isBusinessUser(user: Pick<User, 'role'>): boolean {
  return BUSINESS_ROLES.includes(user.role)
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
