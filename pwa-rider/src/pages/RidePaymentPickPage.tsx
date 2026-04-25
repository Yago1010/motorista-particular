import { useMemo } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { PayMethodIcon } from '../components/PayMethodIcon'
import { normalizePaymentFlowState, paymentFlowReturnBasePath } from '../lib/paymentNavigation'
import type { RidePaymentIconKey, RidePaymentSelection } from '../types/rideFlow'

type RowDef = {
  id: RidePaymentIconKey
  label: string
  sub?: string
}

const ROWS: RowDef[] = [
  {
    id: 'pix',
    label: 'Pix (pré-pago)',
    sub: 'Para esta opção, é necessário pagar antecipadamente',
  },
  { id: 'cash', label: 'Dinheiro' },
  { id: 'terminal', label: 'Maquininha de cartão' },
]

function selectionFor(id: RidePaymentIconKey): RidePaymentSelection {
  const row = ROWS.find((r) => r.id === id)
  return {
    id,
    iconKey: id,
    label: row?.label ?? 'Pagamento',
  }
}

export function RidePaymentPickPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const flow = useMemo(() => normalizePaymentFlowState(location.state), [location.state])

  const picked = useMemo(() => {
    if (!flow) return 'cash' as RidePaymentIconKey
    if (flow.flow === 'ride') return flow.ride.payment?.iconKey ?? 'cash'
    return flow.entrega.payment?.iconKey ?? 'cash'
  }, [flow])

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

  function goConfirm(next: RidePaymentSelection) {
    if (active.flow === 'ride') {
      navigate('/confirmar', { replace: true, state: { ...active.ride, payment: next } })
    } else {
      navigate('/entrega/detalhes', { replace: true, state: { ...active.entrega, payment: next } })
    }
  }

  function back() {
    navigate(paymentFlowReturnBasePath(active), {
      replace: true,
      state: active.flow === 'ride' ? active.ride : active.entrega,
    })
  }

  return (
    <div className="pwa-paypick">
      <header className="pwa-paypick-head">
        <button type="button" className="pwa-paypick-back" aria-label="Voltar" onClick={back}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="pwa-paypick-title">Métodos de pagamento</h1>
      </header>

      <div className="pwa-paypick-body">
        <section className="pwa-paypick-wallet">
          <div className="pwa-paypick-wallet-hd">ChamaPay</div>
          <div className="pwa-paypick-wallet-inner">
            <div className="pwa-paypick-wallet-row">
              <span className="pwa-paypick-wallet-ico" aria-hidden>
                <span className="pwa-paypick-wallet-dot" />
              </span>
              <div className="pwa-paypick-wallet-txt">
                <div className="pwa-paypick-wallet-title">Saldo na Chama</div>
                <div className="pwa-paypick-wallet-bal">R$0,00</div>
                <div className="pwa-paypick-wallet-sub">Saldo insuficiente</div>
              </div>
              <span className="pwa-paypick-wallet-badge">−R$7,00</span>
            </div>
            <button type="button" className="pwa-paypick-wallet-cta">
              Depositar via Pix
            </button>
          </div>
        </section>

        <button type="button" className="pwa-paypick-addcard" onClick={() => navigate('/confirmar/cartao', { state: flow })}>
          <span className="pwa-paypick-addcard-plus" aria-hidden>
            +
          </span>
          <span className="pwa-paypick-addcard-txt">Ad. cartão crédito/débito</span>
          <span className="pwa-paypick-addcard-chev" aria-hidden>
            ›
          </span>
        </button>

        <ul className="pwa-paypick-list" role="radiogroup" aria-label="Forma de pagamento">
          {ROWS.map((row) => {
            const on = picked === row.id
            return (
              <li key={row.id}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={on}
                  className={`pwa-paypick-row${on ? ' pwa-paypick-row--on' : ''}`}
                  onClick={() => goConfirm(selectionFor(row.id))}
                >
                  <PayMethodIcon kind={row.id} className="pwa-paypick-row-ico" />
                  <span className="pwa-paypick-row-mid">
                    <span className="pwa-paypick-row-title">{row.label}</span>
                    {row.sub ? <span className="pwa-paypick-row-sub">{row.sub}</span> : null}
                  </span>
                  <span className={`pwa-paypick-radio${on ? ' pwa-paypick-radio--on' : ''}`} aria-hidden />
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
