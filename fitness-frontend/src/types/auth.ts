// fitness-frontend/src/types/auth.ts
export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: 'user' | 'professional' | 'admin' | 'super_admin'
  avatar?: string
}

export interface AuthTokens {
  accessToken: string
  user: User
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  firstName: string
  lastName: string
  email: string
  password: string
  role: 'user' | 'professional'
}
