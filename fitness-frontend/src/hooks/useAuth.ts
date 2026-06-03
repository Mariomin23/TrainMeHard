'use client'
import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { logout as logoutService } from '@/services/auth.service'
import type { User } from '@/types/auth'

interface UseAuthReturn {
  user: User | null
  isAuthenticated: boolean
  isHydrating: boolean
  logout: () => Promise<void>
}

export function useAuth(): UseAuthReturn {
  const { user, token, isHydrating, logout: clearStore } = useAuthStore()
  const router = useRouter()

  const logout = useCallback(async () => {
    try {
      await logoutService()
    } catch {}
    clearStore()
    document.cookie = 'tmh_session=; Max-Age=0; path=/'
    router.push('/')
  }, [clearStore, router])

  return {
    user,
    isAuthenticated: token !== null,
    isHydrating,
    logout,
  }
}
