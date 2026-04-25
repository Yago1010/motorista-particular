import { useMemo, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { normalizePaymentFlowState } from '../lib/paymentNavigation'
import { addCardFormSchema } from '../lib/validation/schemas'
import { zodIssuesToRecord } from '../lib/validation/zodUtils'
import type { RidePaymentSelection } from '../types/rideFlow'

function digitsOnly(s: string) {
  return s.replace(/\D/g, '')
}

function formatCardInput(raw: string) {
  const d = digitsOnly(raw).slice(0, 19)
  const parts: string[] = []
  for (let i = 0; i < d.length; i += 4) parts.push(d.slice(i, i + 4))
  return parts.join(' ')
}

function formatExpiry(raw: string) {
  const d = digitsOnly(raw).slice(0, 4)
  if (d.length <= 2) return d
  return `${d.slice(0, 2)}/${d.slice(2)}`
}

export function RideAddCardPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const flow = useMemo(() => normalizePaymentFlowState(location.state), [location.state])

  const [number, setNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const cardDigits = useMemo(() => digitsOnly(number), [number])
  const expiryDigits = useMemo(() => digitsOnly(expiry), [expiry])
  const cvvDigits = useMemo(() => digitsOnly(cvv), [cvv])

  const parsedCard = useMemo(
    () => addCardFormSchema.safeParse({ cardNumberDigits: cardDigits, expiryDigits, cvvDigits }),
    [cardDigits, expiryDigits, cvvDigits],
  )
  const valid = parsedCard.success

  if (!flow) {
    return <Navigate to="/home" replace />
  }

  if (flow.flow === 'ride' && (!flow.ride.origin || !flow.ride.dest)) {
    return <Navigate to="/home" replace />
  }

  if (flow.flow === 'entrega' && (!flow.entrega.pickupPrimary || !flow.entrega.dropPrimary)) {
    return <Navigate to="/entrega" replace />
  }

  const active = flow

  function back() {
    navigate('/confirmar/pagamento', { replace: true, state: active })
  }

  function submit() {
    const r = addCardFormSchema.safeParse({ cardNumberDigits: cardDigits, expiryDigits, cvvDigits })
    if (!r.success) {
      setFieldErrors(zodIssuesToRecord(r.error))
      return
    }
    setFieldErrors({})
    const last4 = cardDigits.slice(-4)
    const payment: RidePaymentSelection = {
      id: 'card',
      iconKey: 'card',
      label: `Cartão •••• ${last4}`,
    }
    if (active.flow === 'ride') {
      navigate('/confirmar', { replace: true, state: { ...active.ride, payment } })
    } else {
      navigate('/entrega/detalhes', { replace: true, state: { ...active.entrega, payment } })
    }
  }

  return (
    <div className="pwa-addcard">
      <header className="pwa-addcard-head">
        <button type="button" className="pwa-addcard-back" aria-label="Voltar" onClick={back}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="pwa-addcard-title">Adicionar cartão</h1>
      </header>

      <div className="pwa-addcard-body">
        <div className="pwa-addcard-brands" aria-hidden>
          <span>Mastercard</span>
          <span>Visa</span>
          <span>Elo</span>
          <span>AMEX</span>
          <span>Hipercard</span>
        </div>

        <label className="pwa-addcard-field">
          <span className="pwa-addcard-lbl">Número do cartão</span>
          <span className="pwa-addcard-inputwrap pwa-addcard-inputwrap--card">
            <span className="pwa-addcard-inico" aria-hidden>
              💳
            </span>
            <input
              className="pwa-addcard-input"
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="Cartão de crédito / débito"
              value={number}
              onChange={(e) => {
                setNumber(formatCardInput(e.target.value))
                if (fieldErrors.cardNumberDigits) setFieldErrors((f) => ({ ...f, cardNumberDigits: '' }))
              }}
            />
            <span className="pwa-addcard-cam" aria-hidden title="Digitalizar (em breve)">
              📷
            </span>
          </span>
          {fieldErrors.cardNumberDigits ? <p className="pwa-field-error">{fieldErrors.cardNumberDigits}</p> : null}
        </label>

        <div className="pwa-addcard-row2">
          <label className="pwa-addcard-field">
            <span className="pwa-addcard-lbl">
              Data de validade <button type="button" className="pwa-addcard-help" aria-label="Ajuda validade">?</button>
            </span>
            <input
              className="pwa-addcard-input pwa-addcard-input--boxed"
              inputMode="numeric"
              autoComplete="cc-exp"
              placeholder="MM/AA"
              value={expiry}
              onChange={(e) => {
                setExpiry(formatExpiry(e.target.value))
                if (fieldErrors.expiryDigits) setFieldErrors((f) => ({ ...f, expiryDigits: '' }))
              }}
            />
            {fieldErrors.expiryDigits ? <p className="pwa-field-error">{fieldErrors.expiryDigits}</p> : null}
          </label>
          <label className="pwa-addcard-field">
            <span className="pwa-addcard-lbl">
              Código de segurança <button type="button" className="pwa-addcard-help" aria-label="Ajuda CVV">?</button>
            </span>
            <input
              className="pwa-addcard-input pwa-addcard-input--boxed"
              inputMode="numeric"
              autoComplete="cc-csc"
              placeholder="CVV/CVC"
              value={cvv}
              onChange={(e) => {
                setCvv(digitsOnly(e.target.value).slice(0, 4))
                if (fieldErrors.cvvDigits) setFieldErrors((f) => ({ ...f, cvvDigits: '' }))
              }}
            />
            {fieldErrors.cvvDigits ? <p className="pwa-field-error">{fieldErrors.cvvDigits}</p> : null}
          </label>
        </div>

        <section className="pwa-addcard-trust">
          <div className="pwa-addcard-trust-hd">
            <span aria-hidden>🛡</span> A Chama protege os dados do seu cartão.
          </div>
          <ul>
            <li>Conformidade PCI DSS para a segurança do seu cartão.</li>
            <li>As informações do seu cartão são criptografadas com segurança e nunca são vendidas.</li>
            <li>Verificação gratuita, sem cobranças.</li>
          </ul>
        </section>
      </div>

      <div className="pwa-addcard-foot">
        <button type="button" className="pwa-addcard-submit" disabled={!valid} onClick={submit}>
          Adicionar
        </button>
      </div>
    </div>
  )
}
