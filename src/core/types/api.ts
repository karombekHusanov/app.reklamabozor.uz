import type { User } from '@/modules/auth/types/user'

export interface ApiSuccess<T> {
  success: true
  message: string
  data: T
}

export interface ApiError {
  success: false
  message: string
  errors?: Record<string, string[]>
}

export interface AuthResponse {
  user: User
  token: string
  token_type: 'Bearer'
}

/** Response of POST /api/v1/file-upload. */
export interface UploadedFile {
  id: number
  url: string
  original_name: string
  mime_type: string | null
  size: number
  created_at: string
}

export interface HealthResponse {
  status: string
  service: string
  environment: string
  timestamp: string
}
