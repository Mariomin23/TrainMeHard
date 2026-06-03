import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from './auth.store'
import type { User } from '@/types/auth'

const mockUser: User = {
  id: '1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  role: 'user',
}

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, token: null, isHydrating: false })
  })

  it('setAuth stores token and user in memory only', () => {
    useAuthStore.getState().setAuth('tok123', mockUser)
    expect(useAuthStore.getState().token).toBe('tok123')
    expect(useAuthStore.getState().user).toEqual(mockUser)
    expect(localStorage.getItem('tmh_token')).toBeNull()
  })

  it('logout clears token and user', () => {
    useAuthStore.getState().setAuth('tok123', mockUser)
    useAuthStore.getState().logout()
    expect(useAuthStore.getState().token).toBeNull()
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('setHydrating updates isHydrating flag', () => {
    useAuthStore.getState().setHydrating(true)
    expect(useAuthStore.getState().isHydrating).toBe(true)
    useAuthStore.getState().setHydrating(false)
    expect(useAuthStore.getState().isHydrating).toBe(false)
  })
})
