import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth'

export default function LoginView() {
  const navigate = useNavigate()
  const authStore = useAuthStore()

  const [form, setForm] = useState({ cpf: '123.456.789-00', password: 'Admin123!' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const formatCpf = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length > 11) value = value.slice(0, 11)
    if (value.length > 3) value = `${value.slice(0, 3)}.${value.slice(3)}`
    if (value.length > 7) value = `${value.slice(0, 7)}.${value.slice(7)}`
    if (value.length > 11) value = `${value.slice(0, 11)}-${value.slice(11)}`
    setForm((prev) => ({ ...prev, cpf: value }))
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const cpf = form.cpf.replace(/\D/g, '')
    if (cpf.length !== 11) {
      setError('CPF inválido')
      setLoading(false)
      return
    }

    const result = await authStore.login(form.cpf, form.password)
    if (result.success) {
      toast.success('Login efetuado!')
      navigate('/')
    } else {
      setError(result.message || 'Credenciais inválidas')
    }
    setLoading(false)
  }

  return (
    <div className="screen active flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-600 to-blue-800">
      <div className="container w-full max-w-md px-4 pt-16">
        <div className="card rounded-2xl bg-white shadow-lg">
          <div className="card-header border-0 bg-transparent px-6 pt-6 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#007bff" strokeWidth={2}>
                <path d="M18 8c0-2.5-2-4.5-4.5-4.5S9 5.5 9 8c0 3.5 4.5 8 6 11 1.5-3 6-7.5 6-11z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Motorista</h1>
            <p className="text-gray-500">Entre na sua conta para continuar</p>
          </div>

          <form onSubmit={handleLogin} className="card-body space-y-4 p-6">
            <div>
              <label htmlFor="cpf" className="form-label mb-1 block text-sm font-medium">CPF</label>
              <input
                id="cpf"
                className="form-control w-full rounded-lg border border-gray-300 px-3 py-2"
                value={form.cpf}
                onChange={formatCpf}
                placeholder="000.000.000-00"
                required
                disabled={loading}
                maxLength={14}
              />
            </div>
            <div>
              <label htmlFor="password" className="form-label mb-1 block text-sm font-medium">Senha</label>
              <input
                id="password"
                type="password"
                className="form-control w-full rounded-lg border border-gray-300 px-3 py-2"
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-block w-full rounded-lg bg-blue-600 py-3 font-semibold text-white disabled:opacity-60"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="card-footer border-0 px-6 pb-6 text-center text-sm text-gray-500">
            Demo: <code>123.456.789-00</code> / <code>Admin123!</code>
          </div>
        </div>
      </div>
    </div>
  )
}
