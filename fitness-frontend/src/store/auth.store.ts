'use client'
import { create } from 'zustand'
import type { User } from '@/types/auth'

interface AuthStore {
  user: User | null
  token: string | null
  isHydrating: boolean
  setAuth: (token: string, user: User) => void
  setHydrating: (v: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isHydrating: false,
  setAuth: (token, user) => set({ token, user }),
  setHydrating: (isHydrating) => set({ isHydrating }),
  logout: () => set({ token: null, user: null }),
}))
