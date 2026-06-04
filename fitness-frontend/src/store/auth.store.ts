'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types/auth'

interface AuthStore {
  user: User | null
  token: string | null
  isHydrating: boolean
  setAuth: (token: string, user: User) => void
  setHydrating: (v: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isHydrating: false,
      setAuth: (token, user) => set({ token, user }),
      setHydrating: (isHydrating) => set({ isHydrating }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: 'tmh-auth',
      partialize: (s) => ({ user: s.user, token: s.token }),
    }
  )
)
