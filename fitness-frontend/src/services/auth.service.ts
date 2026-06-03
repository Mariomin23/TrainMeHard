import api from '@/lib/api'
import type { AuthTokens, LoginPayload, RegisterPayload, User } from '@/types/auth'

export const login = (payload: LoginPayload): Promise<AuthTokens> =>
  api.post('/auth/login', payload).then((r) => r.data.data)

export const register = (payload: RegisterPayload): Promise<AuthTokens> =>
  api.post('/auth/register', payload).then((r) => r.data.data)

export const logout = (): Promise<void> =>
  api.delete('/auth/logout').then(() => undefined)

export const getMe = (): Promise<User> =>
  api.get('/users/me').then((r) => r.data.data)
