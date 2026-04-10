'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (token) {
      try {
        const payload = JSON.parse(atob(token))
        if (payload.exp > Date.now()) {
          router.replace('/admin/dashboard')
          return
        }
        localStorage.removeItem('admin_token')
      } catch {
        localStorage.removeItem('admin_token')
      }
    }
    setCheckingAuth(false)
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al iniciar sesion')
        return
      }

      localStorage.setItem('admin_token', data.token)
      router.push('/admin/dashboard')
    } catch {
      setError('Error de conexion. Intente de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--timon-cream)]">
        <div className="w-8 h-8 border-4 border-[var(--timon-red)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--timon-cream)]">
      {/* Header */}
      <div className="bg-[var(--timon-dark)] py-6 px-4 text-center shadow-lg">
        <h1 className="text-3xl font-bold text-white tracking-wide">
          EL TIMON
        </h1>
        <p className="text-[var(--timon-gold)] text-sm mt-1 tracking-widest uppercase">
          Panel de Administracion
        </p>
      </div>

      {/* Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Form header accent */}
            <div className="h-1.5 bg-gradient-to-r from-[var(--timon-red)] via-[var(--timon-gold)] to-[var(--timon-red)]" />

            <div className="p-8">
              <h2 className="text-2xl font-bold text-[var(--timon-dark)] mb-1">
                Iniciar Sesion
              </h2>
              <p className="text-gray-500 text-sm mb-8">
                Ingrese sus credenciales para acceder al panel
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    Correo Electronico
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="admin@eltimon.com"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-[var(--timon-dark)] placeholder-gray-400 outline-none transition-all duration-200 focus:border-[var(--timon-red)] focus:ring-2 focus:ring-[var(--timon-red)]/20 focus:bg-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    Contrasena
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="Ingrese su contrasena"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-[var(--timon-dark)] placeholder-gray-400 outline-none transition-all duration-200 focus:border-[var(--timon-red)] focus:ring-2 focus:ring-[var(--timon-red)]/20 focus:bg-white"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium border border-red-100 flex items-center gap-2">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-[var(--timon-red)] hover:bg-[var(--timon-red-dark)] disabled:opacity-60 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed shadow-lg shadow-[var(--timon-red)]/20 hover:shadow-[var(--timon-red)]/30"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Ingresando...
                    </>
                  ) : (
                    'Ingresar'
                  )}
                </button>
              </form>
            </div>
          </div>

          <p className="text-center text-gray-400 text-xs mt-6">
            El Timon - Cocteles y Mariscos desde 1995
          </p>
        </div>
      </div>
    </div>
  )
}
