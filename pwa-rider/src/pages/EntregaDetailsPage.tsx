import { useMemo, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { PayMethodIcon } from '../components/PayMethodIcon'
import { DEFAULT_PAYMENT } from '../lib/paymentFlow'
import type { PaymentFlowLocationState } from '../lib/paymentNavigation'
import type { EntregaDetailsNavState, EntregaServiceId } from '../types/entregaFlow'

function formatBrl(n: number) {
  return `R$${n.toFixed(2).replace('.', ',')}`
}

function round2(v: number) {
  return Math.round(v * 100) / 100
}

function entregaPrices() {
  const km = 2.4
  const durMin = 9
  const dynamic = km > 14 ? 1.08 : 1
  const pop = Math.max(8.9, (4.4 + km * 2.1 + durMin * 0.33) * dynamic)
  const moto = Math.max(6.7, 2.8 + km * 1.45 + durMin * 0.19)
  const entregaMoto = round2(moto + 2.6)
  const entregaCar = round2(pop + 2.1)
  return { moto: entregaMoto, car: entregaCar }
}

export function EntregaDetailsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as EntregaDetailsNavState | null

  const [doneMsg, setDoneMsg] = useState('')

  const prices = useMemo(() => entregaPrices(), [])

  if (!state || !state.pickupPrimary || !state.dropPrimary) {
    return <Navigate to="/entrega" replace />
  }

  const details = state
  const payment = details.payment ?? DEFAULT_PAYMENT
  const service = details.service
  const total = service === 'car' ? prices.car : prices.moto

  function setService(next: EntregaServiceId) {
    navigate('/entrega/detalhes', { replace: true, state: { ...details, service: next } })
  }

  function openPayment() {
    const payload: PaymentFlowLocationState = {
      flow: 'entrega',
      entrega: {
        flow: details.flow,
        pickupPrimary: details.pickupPrimary,
        pickupSecondary: details.pickupSecondary,
        dropPrimary: details.dropPrimary,
        dropSecondary: details.dropSecondary,
        service: details.service,
        item: details.item,
        payment,
      },
    }
    navigate('/confirmar/pagamento', { state: payload })
  }

  function openItem() {
    navigate('/entrega/item', { state: details })
  }

  function confirmDelivery() {
    setDoneMsg('Pedido de entrega enviado (demonstração).')
    window.setTimeout(() => navigate('/entrega', { replace: true }), 1600)
  }

  const itemSummary = !details.item
    ? 'Adicionar uma observação na entrega'
    : [details.item.typeLabel, details.item.valueBrl && details.item.valueBrl !== '0,00' ? `R$${details.item.valueBrl}` : '', details.item.notes.trim()]
        .filter(Boolean)
        .join(' · ')
        .slice(0, 80) || 'Item registado'

  return (
    <div className="pwa-ent-det">
      <header className="pwa-ent-det-head">
        <button type="button" className="pwa-ent-det-back" aria-label="Voltar" onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="pwa-ent-det-title">Detalhes da entrega</h1>
      </header>

      <div className="pwa-ent-det-body">
        <section className="pwa-ent-det-card pwa-ent-det-route">
          <button type="button" className="pwa-ent-det-stop">
            <span className="pwa-ent-dot pwa-ent-dot--teal" aria-hidden />
            <span className="pwa-ent-det-stop-mid">
              <span className="pwa-ent-det-stop-t">{details.pickupPrimary}</span>
              <span className="pwa-ent-det-stop-s">{details.pickupSecondary}</span>
            </span>
            <span className="pwa-ent-det-stop-chev" aria-hidden>
              ›
            </span>
          </button>
          <div className="pwa-ent-det-midico" aria-hidden>
            ⇅
          </div>
          <button type="button" className="pwa-ent-det-stop">
            <span className="pwa-ent-dot pwa-ent-dot--orange" aria-hidden />
            <span className="pwa-ent-det-stop-mid">
              <span className="pwa-ent-det-stop-t">{details.dropPrimary}</span>
              <span className="pwa-ent-det-stop-s">{details.dropSecondary}</span>
            </span>
            <span className="pwa-ent-det-stop-chev" aria-hidden>
              ›
            </span>
          </button>
        </section>

        <button type="button" className="pwa-ent-det-card pwa-ent-det-itemrow" onClick={openItem}>
          <span className="pwa-ent-det-item-ico" aria-hidden>
            📦
          </span>
          <span className="pwa-ent-det-item-mid">
            <span className="pwa-ent-det-item-title">Inserir detalhes do item</span>
            <span className="pwa-ent-det-item-sub">{itemSummary}</span>
          </span>
          <span className="pwa-ent-det-stop-chev" aria-hidden>
            ›
          </span>
        </button>

        <section className="pwa-ent-det-card pwa-ent-det-opts">
          <ul className="pwa-ent-det-optlist">
            <li>
              <button
                type="button"
                className={`pwa-ent-det-opt${service === 'moto' ? ' pwa-ent-det-opt--on' : ''}`}
                onClick={() => setService('moto')}
              >
                <span className="pwa-ent-det-opt-ico" aria-hidden>
                  🏍📦
                </span>
                <span className="pwa-ent-det-opt-mid">
                  <span className="pwa-ent-det-opt-t">Entrega Moto</span>
                  <span className="pwa-ent-det-opt-s">Entregas rápidas</span>
                  <span className="pwa-ent-det-opt-dim">40×34×36 cm · 10 kg</span>
                </span>
                <span className="pwa-ent-det-opt-price">{formatBrl(prices.moto)}</span>
                <span className={`pwa-ent-det-radio${service === 'moto' ? ' pwa-ent-det-radio--on' : ''}`} aria-hidden />
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`pwa-ent-det-opt${service === 'car' ? ' pwa-ent-det-opt--on' : ''}`}
                onClick={() => setService('car')}
              >
                <span className="pwa-ent-det-opt-ico" aria-hidden>
                  🚗📦
                </span>
                <span className="pwa-ent-det-opt-mid">
                  <span className="pwa-ent-det-opt-t">Entrega Carro</span>
                  <span className="pwa-ent-det-opt-s">Envio de pacotes</span>
                  <span className="pwa-ent-det-opt-dim">100×70×60 cm · 30 kg</span>
                </span>
                <span className="pwa-ent-det-opt-price">{formatBrl(prices.car)}</span>
                <span className={`pwa-ent-det-radio${service === 'car' ? ' pwa-ent-det-radio--on' : ''}`} aria-hidden />
              </button>
            </li>
          </ul>
        </section>

        <div className="pwa-ent-det-pin">
          <span>Verificar com PIN</span>
          <button type="button" className="pwa-ent-det-pin-i" aria-label="Informação">
            ⓘ
          </button>
        </div>
      </div>

      <footer className="pwa-ent-det-foot">
        <button type="button" className="pwa-ent-det-pay" onClick={openPayment}>
          <PayMethodIcon kind={payment.iconKey} className="pwa-ent-det-pay-ico" />
          <span className="pwa-ent-det-pay-lbl">{payment.label}</span>
          <span className="pwa-ent-det-pay-change">Toque para alterar &gt;</span>
        </button>
        <div className="pwa-ent-det-cta">
          <div className="pwa-ent-det-total">{formatBrl(total)}</div>
          <button type="button" className="pwa-ent-det-confirm" onClick={confirmDelivery}>
            Confirmar
          </button>
        </div>
        {doneMsg ? <p className="pwa-ent-det-toast">{doneMsg}</p> : null}
      </footer>
    </div>
  )
}
