// fitness-frontend/src/components/Navbar.tsx
'use client'
import Link from 'next/link'
import { useState } from 'react'
import { LogOut, LayoutDashboard, Menu, X } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export default function Navbar() {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    setMenuOpen(false)
    await logout()
  }

  const closeMenu = () => setMenuOpen(false)

  const dashboardHref =
    user?.role === 'professional' ? '/dashboard/professional' : '/dashboard'

  const displayName = user ? user.firstName : null

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
      <div className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="text-2xl font-black tracking-tight" onClick={closeMenu}>
          <span className="text-gray-900">TrainMe</span><span className="text-green-500">Hard</span>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          <Link href="/professionals" className="hover:text-green-600 transition-colors">
            Encontrar Profesional
          </Link>

          {user ? (
            <>
              <Link
                href={dashboardHref}
                className="flex items-center gap-1.5 hover:text-green-600 transition-colors"
              >
                <LayoutDashboard size={16} />
                {displayName}
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-gray-500 hover:text-red-500 transition-colors"
              >
                <LogOut size={16} /> Salir
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-green-600 transition-colors">
                Iniciar Sesión
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-400 transition-colors"
              >
                Regístrate
              </Link>
            </>
          )}
        </div>

        <button
          className="md:hidden text-gray-600 p-1"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-6 py-4 flex flex-col gap-4 text-sm font-medium text-gray-600">
          <Link href="/professionals" className="hover:text-green-600 transition-colors" onClick={closeMenu}>
            Encontrar Profesional
          </Link>

          {user ? (
            <>
              <Link
                href={dashboardHref}
                className="flex items-center gap-1.5 hover:text-green-600 transition-colors"
                onClick={closeMenu}
              >
                <LayoutDashboard size={16} />
                {displayName}
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-gray-500 hover:text-red-500 transition-colors w-fit"
              >
                <LogOut size={16} /> Salir
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-green-600 transition-colors" onClick={closeMenu}>
                Iniciar Sesión
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-400 transition-colors text-center"
                onClick={closeMenu}
              >
                Regístrate
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
