'use client'
import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth.store'
import Navbar from '@/components/Navbar'

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { setAuth, setHydrating, isHydrating } = useAuthStore()

  useEffect(() => {
    setHydrating(true)
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data) => setAuth(data.data.accessToken, data.data.user))
      .catch(() => {
        document.cookie = 'tmh_session=; Max-Age=0; path=/'
        window.location.href = '/login'
      })
      .finally(() => setHydrating(false))
  }, [setAuth, setHydrating])

  return (
    <>
      <Navbar />
      {isHydrating ? <main className="flex-1 bg-gray-50" /> : children}
    </>
  )
}
