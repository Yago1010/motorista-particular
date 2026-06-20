import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth'
import { DEMO_RIDER } from '@/config/demoUsers'
import ChamaAuthShell from '@/components/ChamaAuthShell'

export default function LoginView() {
  const navigate = useNavigate()
  const authStore = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await authStore.login(email, password)
    setLoading(false)
    if (result.success) {
      toast.success('Login efetuado!')
      navigate('/')
    } else {
      setError(result.message || 'Credenciais inválidas')
    }
  }

  const handleDemo = async () => {
    setEmail(DEMO_RIDER.email)
    setPassword(DEMO_RIDER.password)
    setLoading(true)
    const result = await authStore.login(DEMO_RIDER.email, DEMO_RIDER.password)
    setLoading(false)
    if (result.success) {
      toast.success('Modo demo ativado!')
      navigate('/')
    }
  }

  return (
    <ChamaAuthShell heading="Entrar" footer="Conta de passageiro do sistema Chama no 12">
      <form onSubmit={handleLogin}>
        <label className="pwa-muted" htmlFor="email">E-mail</label>
        <input
          id="email"
          type="email"
          className="pwa-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          required
          disabled={loading}
        />

        <label className="pwa-muted mt-3 block" htmlFor="password">Senha</label>
        <div className="pwa-password-row">
          <input
            id="password"
            type={showPw ? 'text' : 'password'}
            className="pwa-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={loading}
          />
          <button type="button" className="pwa-toggle-pw" onClick={() => setShowPw(!showPw)}>
            {showPw ? 'Ocultar' : 'Ver'}
          </button>
        </div>

        {error && <p className="pwa-error mt-2">{error}</p>}

        <button type="submit" className="pwa-btn-theme mt-4" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
        <button type="button" className="pwa-btn-theme mt-2" onClick={handleDemo} disabled={loading}>
          Teste (Demo)
        </button>
      </form>

      <p className="pwa-muted mt-4 text-center">
        Não tem conta?{' '}
        <Link to="/register" style={{ color: 'var(--chama-neon)' }}>
          Criar conta
        </Link>
      </p>
    </ChamaAuthShell>
  )
}
