import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { toast } from 'sonner'

export default function RegisterView() {
  const navigate = useNavigate()
  const authStore = useAuthStore()

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    otp: '',
  })

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpTimeLeft, setOtpTimeLeft] = useState(60)
  const otpTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const formatPhone = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length > 11) value = value.slice(0, 11)
    if (value.length > 2) {
      value = `(${value.slice(0, 2)}) ${value.slice(2)}`
    }
    if (value.length > 10) {
      value = `${value.slice(0, 10)}-${value.slice(10)}`
    }
    setForm((prev) => ({ ...prev, phone: value }))
  }

  const formatOtp = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setForm((prev) => ({ ...prev, otp: value }))
  }

  const startOtpTimer = () => {
    setOtpTimeLeft(60)
    if (otpTimerRef.current) clearInterval(otpTimerRef.current)
    otpTimerRef.current = setInterval(() => {
      setOtpTimeLeft((prev) => {
        if (prev <= 1) {
          if (otpTimerRef.current) clearInterval(otpTimerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const resendOtp = async () => {
    setError('')
    setLoading(true)

    try {
      const result = await authStore.sendOtp(form.phone)
      if (result.success) {
        startOtpTimer()
        toast.success('Novo código SMS enviado!')
      } else {
        setError(result.message || 'Erro ao enviar código')
      }
    } catch (e) {
      setError('Erro ao reenviar código')
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterFlow = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!otpSent) {
      if (form.password !== form.confirm_password) {
        setError('As senhas não coincidem')
        setLoading(false)
        return
      }

      if (form.password.length < 6) {
        setError('A senha deve conter pelo menos 6 caracteres')
        setLoading(false)
        return
      }

      const rawPhone = form.phone.replace(/\D/g, '')
      if (rawPhone.length !== 11) {
        setError('Telefone inválido')
        setLoading(false)
        return
      }

      try {
        const result = await authStore.sendOtp(form.phone)
        if (result.success) {
          setOtpSent(true)
          startOtpTimer()
          toast.success('Código de verificação enviado por SMS!')
        } else {
          setError(result.message || 'Erro ao registrar')
        }
      } catch (err: any) {
        setError(err.message || 'Erro ao enviar verificação')
      } finally {
        setLoading(false)
      }
    } else {
      if (!form.otp || form.otp.length !== 6) {
        setError('Código inválido')
        setLoading(false)
        return
      }

      try {
        const result = await authStore.verifyOtpAndRegister(form.phone, form.otp, {
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          phone: form.phone,
          password: form.password,
        })

        if (result.success) {
          toast.success('Conta criada com sucesso!')
          navigate('/home')
        } else {
          setError(result.message || 'Código inválido ou erro no cadastro')
        }
      } catch (e) {
        setError('Erro ao criar conta')
      } finally {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    return () => {
      if (otpTimerRef.current) clearInterval(otpTimerRef.current)
    }
  }, [])

  return (
    <div className="screen active" style={{ justifyContent: 'center', background: 'linear-gradient(180deg, #28a745 0%, #1e7e34 100%)', minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      <div className="container" style={{ width: '100%', maxWidth: '400px', padding: '1.5rem' }}>
        <div className="card" style={{ borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)', background: 'white', padding: '1.5rem' }}>
          <div className="card-header" style={{ textAlign: 'center', borderBottom: 'none', background: 'transparent' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', boxShadow: 'var(--shadow)' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#28a745" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="17" y1="11" x2="23" y2="11" />
              </svg>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--gray-900)', marginBottom: '0.25rem' }}>Cadastro</h1>
            <p style={{ color: 'var(--gray-500)' }}>Crie sua conta de passageiro</p>
          </div>

          <div className="card-body" style={{ marginTop: '1.5rem' }}>
            <form onSubmit={handleRegisterFlow}>
              {!otpSent ? (
                <>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label" htmlFor="first_name" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>Nome</label>
                      <input
                        type="text"
                        id="first_name"
                        className="form-control"
                        value={form.first_name}
                        onChange={(e) => setForm((prev) => ({ ...prev, first_name: e.target.value }))}
                        placeholder="João"
                        required
                        disabled={loading}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--gray-300)' }}
                      />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label" htmlFor="last_name" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>Sobrenome</label>
                      <input
                        type="text"
                        id="last_name"
                        className="form-control"
                        value={form.last_name}
                        onChange={(e) => setForm((prev) => ({ ...prev, last_name: e.target.value }))}
                        placeholder="Silva"
                        required
                        disabled={loading}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--gray-300)' }}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label" htmlFor="email" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>E-mail</label>
                    <input
                      type="email"
                      id="email"
                      className="form-control"
                      value={form.email}
                      onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="seu@email.com"
                      required
                      disabled={loading}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--gray-300)' }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label" htmlFor="phone" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>Telefone</label>
                    <input
                      type="tel"
                      id="phone"
                      className="form-control"
                      value={form.phone}
                      onChange={formatPhone}
                      placeholder="(11) 99999-9999"
                      required
                      disabled={loading}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--gray-300)' }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label" htmlFor="password" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>Senha</label>
                    <input
                      type="password"
                      id="password"
                      className="form-control"
                      value={form.password}
                      onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                      placeholder="Mínimo 6 caracteres"
                      required
                      disabled={loading}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--gray-300)' }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label" htmlFor="confirm_password" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>Confirmar Senha</label>
                    <input
                      type="password"
                      id="confirm_password"
                      className="form-control"
                      value={form.confirm_password}
                      onChange={(e) => setForm((prev) => ({ ...prev, confirm_password: e.target.value }))}
                      placeholder="Repita a senha"
                      required
                      disabled={loading}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--gray-300)' }}
                    />
                  </div>
                </>
              ) : (
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label" htmlFor="otp" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>Código SMS enviado para {form.phone}</label>
                  <input
                    type="text"
                    id="otp"
                    className="form-control text-center"
                    value={form.otp}
                    onChange={formatOtp}
                    placeholder="• • • • • •"
                    required
                    maxLength={6}
                    autoComplete="one-time-code"
                    disabled={loading}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--gray-300)', letterSpacing: '0.5rem', fontSize: '1.25rem', textAlign: 'center' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.75rem' }}>
                    <span style={{ color: 'var(--gray-500)' }}>Código expira em {otpTimeLeft}s</span>
                    <button type="button" className="btn btn-link btn-sm" onClick={resendOtp} disabled={otpTimeLeft > 0 || loading} style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer' }}>Reenviar</button>
                  </div>
                </div>
              )}

              {error && (
                <div className="toast error" style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  <span style={{ fontSize: '0.875rem' }}>{error}</span>
                </div>
              )}

              <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', background: '#28a745', color: 'white', border: 'none', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {loading ? <div className="spinner" style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> : <span>{otpSent ? 'Criar Conta' : 'Enviar código SMS'}</span>}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--gray-200)' }}>
              <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Já tem uma conta?</p>
              <button onClick={() => navigate('/login')} className="btn btn-outline btn-block" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid #28a745', color: '#28a745', background: 'white', fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}>
                Entrar
              </button>
            </div>
          </div>
        </div>

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', marginTop: '2rem', fontSize: '0.875rem' }}>
          Uber Clone 2025 - App do Passageiro
        </p>
      </div>
    </div>
  )
}
