// fitness-frontend/src/app/(auth)/register/page.tsx
'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { register } from '@/services/auth.service'
import type { RegisterPayload } from '@/types/auth'

export default function RegisterPage() {
  const [form, setForm] = useState<RegisterPayload>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'user',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const router = useRouter()

  const set =
    (k: keyof RegisterPayload) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await register(form)
      setAuth(data.accessToken, data.user)
      document.cookie = `tmh_session=1; path=/; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`
      router.push(data.user.role === 'professional' ? '/dashboard/professional' : '/dashboard')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg || 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-16 bg-gray-950">
      <div className="w-full max-w-md">
        <Link href="/" className="block text-center text-2xl font-black tracking-tight mb-8">
          <span className="text-white">TrainMe</span><span className="text-green-500">Hard</span>
        </Link>

        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Crea tu cuenta</h1>
          <p className="text-gray-500 text-sm mb-8">Gratis. Sin suscripciones.</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre</label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={set('firstName')}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-900 bg-gray-50 focus:bg-white"
                  placeholder="Juan"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Apellido</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={set('lastName')}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-900 bg-gray-50 focus:bg-white"
                  placeholder="García"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-900 bg-gray-50 focus:bg-white"
                placeholder="tu@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Contraseña</label>
              <input
                type="password"
                value={form.password}
                onChange={set('password')}
                required
                minLength={8}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-900 bg-gray-50 focus:bg-white"
                placeholder="Mínimo 8 caracteres"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Soy...</label>
              <div className="grid grid-cols-2 gap-3">
                {(['user', 'professional'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, role: r }))}
                    className={`py-3 rounded-xl border text-sm font-semibold transition-all ${
                      form.role === r
                        ? 'border-green-500 bg-green-50 text-green-700 shadow-sm'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
                    }`}
                  >
                    {r === 'user' ? '🏋️ Busco profesional' : '💼 Soy profesional'}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-400 transition-colors disabled:opacity-50 mt-1"
            >
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-green-600 font-semibold hover:text-green-500 transition-colors">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
