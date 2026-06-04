'use client'
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import Navbar from '@/components/Navbar'

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, token, setAuth, setHydrating, isHydrating, logout } = useAuthStore()
  const router = useRouter()
  const checked = useRef(false)

  useEffect(() => {
    if (checked.current) return
    checked.current = true

    // Token already in localStorage — render immediately
    if (token && user) {
      setHydrating(false)
      return
    }

    // No token — try refresh cookie as fallback
    setHydrating(true)
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data) => setAuth(data.data.accessToken, data.data.user))
      .catch(() => {
        logout()
        router.replace('/login')
      })
      .finally(() => setHydrating(false))
  }, [token, user, setAuth, setHydrating, logout, router])

  if (!token && !isHydrating) return null

  return (
    <>
      <Navbar />
      {isHydrating ? <main className="flex-1 bg-gray-50" /> : children}
    </>
  )
}
