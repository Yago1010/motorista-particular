import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { loginRider } from '../lib/api'
import { saveSession } from '../lib/storage'
import { loginFormSchema } from '../lib/validation/schemas'
import { zodIssuesToRecord } from '../lib/validation/zodUtils'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const mutation = useMutation({
    mutationFn: (values: { email: string; password: string }) => loginRider(values.email, values.password),
    onSuccess: (session) => {
      saveSession(session)
      navigate('/home')
    },
    onError: (err: Error) => setError(err.message),
  })

  function tryLogin() {
    setError('')
    setFieldErrors({})
    const parsed = loginFormSchema.safeParse({ email, password })
    if (!parsed.success) {
      setFieldErrors(zodIssuesToRecord(parsed.error))
      return
    }
    mutation.mutate(parsed.data)
  }

  return (
    <div id="pwa-login-page">
      <img className="pwa-imghome" src="/chama-logo.png" alt="CHAMA NO 12" />
      <section className="pwa-form-login">
        <h2 className="pwa-form-login-heading">Entrar</h2>
        <div className="pwa-login-wrap">
          <div>
            <input
              className="pwa-input"
              type="email"
              autoComplete="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (fieldErrors.email) setFieldErrors((f) => ({ ...f, email: '' }))
              }}
            />
            {fieldErrors.email ? <p className="pwa-field-error">{fieldErrors.email}</p> : null}
          </div>
          <div className="pwa-password-row">
            <div style={{ flex: 1, minWidth: 0 }}>
              <input
                className="pwa-input"
                type={showPw ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Senha"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (fieldErrors.password) setFieldErrors((f) => ({ ...f, password: '' }))
                }}
              />
              {fieldErrors.password ? <p className="pwa-field-error">{fieldErrors.password}</p> : null}
            </div>
            <button
              type="button"
              className="pwa-toggle-pw"
              aria-label={showPw ? 'Ocultar senha' : 'Mostrar senha'}
              onClick={() => setShowPw((v) => !v)}
            >
              {showPw ? 'Ocultar' : 'Ver'}
            </button>
          </div>
          {error ? <p className="pwa-error">{error}</p> : null}
          <button
            type="button"
            className="pwa-btn-theme"
            disabled={mutation.isPending}
            onClick={tryLogin}
          >
            {mutation.isPending ? 'A entrar…' : 'Entrar'}
          </button>
          <p className="pwa-muted" style={{ textAlign: 'center', marginTop: 8 }}>
            Conta de passageiro do sistema Chama no 12
          </p>
        </div>
      </section>
    </div>
  )
}
