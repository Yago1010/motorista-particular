import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth'

export default function RegisterView() {
  const navigate = useNavigate()
  const authStore = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    cpf: '',
    phone: '',
    email: '',
    password: '',
    confirm_password: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirm_password) {
      toast.error('Senhas não conferem')
      return
    }
    setLoading(true)
    const result = await authStore.register(form)
    setLoading(false)
    if (result.success) {
      toast.success('Cadastro realizado!')
      navigate('/')
    } else {
      toast.error(result.message || 'Erro no cadastro')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-800 p-4 py-10">
      <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-3 rounded-2xl bg-white p-6 shadow-lg">
        <h1 className="text-center text-2xl font-bold">Cadastro Motorista</h1>
        {(['first_name', 'last_name', 'cpf', 'phone', 'email', 'password', 'confirm_password'] as const).map((field) => (
          <input
            key={field}
            type={field.includes('password') ? 'password' : 'text'}
            placeholder={field.replace('_', ' ')}
            value={form[field]}
            onChange={(e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))}
            className="w-full rounded-lg border px-3 py-2"
            required
          />
        ))}
        <button type="submit" disabled={loading} className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white">
          {loading ? 'Cadastrando...' : 'Cadastrar'}
        </button>
        <p className="text-center text-sm">
          Já tem conta? <Link to="/login" className="text-blue-600">Entrar</Link>
        </p>
      </form>
    </div>
  )
}
