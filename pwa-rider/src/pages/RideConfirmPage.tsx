import { useEffect, useMemo, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { RideMap } from '../components/RideMap'
import { createRideRequest, getRequestInProgress } from '../lib/api'
import { ApiError } from '../lib/http'
import { fetchDrivingRoute, type RouteResult } from '../lib/routeDirections'
import { readSession } from '../lib/storage'
import type { RideConfirmNavState } from '../types/rideFlow'

type RideKind = 'pop' | 'moto' | 'negocia'

function formatBrl(n: number) {
  return `R$${n.toFixed(2).replace('.', ',')}`
}

function estimatePrices(km: number, durMin: number) {
  const pop = Math.max(7.9, 5.4 + km * 2.75 + durMin * 0.34)
  const moto = Math.max(5.2, pop * 0.56)
  const entregaMoto = moto + 2.6
  const entregaCar = pop + 1.4
  const negocia = Math.max(6.5, pop * 0.86)
  return { pop, moto, entregaMoto, entregaCar, negocia }
}

export function RideConfirmPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const session = readSession()
  const state = location.state as RideConfirmNavState | null

  const [route, setRoute] = useState<RouteResult | null>(null)
  const [routeErr, setRouteErr] = useState('')
  const [selected, setSelected] = useState<RideKind>('pop')
  const [negociaVal, setNegociaVal] = useState<number | null>(null)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (!state?.origin || !state?.dest) return
    let cancelled = false
    setRouteErr('')
    void fetchDrivingRoute(state.origin, state.dest)
      .then((r) => {
        if (!cancelled) setRoute(r)
      })
      .catch((e: Error) => {
        if (!cancelled) setRouteErr(e.message ?? 'Rota indisponível.')
      })
    return () => {
      cancelled = true
    }
  }, [state])

  const km = route ? route.distanceM / 1000 : 0
  const durMin = route ? route.durationS / 60 : 0
  const prices = useMemo(() => estimatePrices(km || 0.5, durMin || 4), [km, durMin])

  useEffect(() => {
    if (negociaVal == null && prices.negocia > 0) {
      setNegociaVal(Math.round(prices.negocia * 100) / 100)
    }
  }, [prices.negocia, negociaVal])

  const displayPrice = useMemo(() => {
    if (selected === 'moto') return prices.moto
    if (selected === 'negocia') return negociaVal ?? prices.negocia
    return prices.pop
  }, [selected, prices, negociaVal])

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!session) throw new Error('Sessão inválida')
      if (!state?.origin || !state?.dest) throw new Error('Dados em falta.')
      return createRideRequest(session, state.origin.lat, state.origin.lng, state.dest.lat, state.dest.lng)
    },
    onSuccess: async () => {
      if (!session) return
      try {
        const status = await getRequestInProgress(session)
        if (status.request_id > 0) {
          navigate(`/status/${status.request_id}`, { replace: true })
        } else {
          setMsg('Pedido enviado. Aguarda confirmação.')
        }
      } catch (e) {
        setMsg(e instanceof Error ? e.message : 'Erro ao consultar pedido.')
      }
    },
    onError: (err: Error) => {
      setMsg(err instanceof ApiError ? err.message : err.message)
    },
  })

  function backToSearch() {
    if (!state) {
      navigate('/home', { replace: true })
      return
    }
    navigate('/destino', {
      replace: true,
      state: { origin: state.origin, pickupLabel: state.pickupLabel },
    })
  }

  if (!session) return null
  if (!state?.origin || !state?.dest) {
    return <Navigate to="/home" replace />
  }

  const sheetBusy = createMutation.isPending

  return (
    <div className="pwa-confirm">
      <div className="pwa-confirm-mapwrap">
        <button type="button" className="pwa-confirm-back" aria-label="Voltar" onClick={backToSearch}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <RideMap
          origin={state.origin}
          dest={state.dest}
          routePath={route?.path ?? null}
          className="pwa-map-inner pwa-map-inner--confirm"
        />
        <div className="pwa-confirm-pills">
          <div className="pwa-confirm-pill">
            <span className="pwa-confirm-pill-txt">
              {(state.pickupLabel ?? '').slice(0, 48)}
              {(state.pickupLabel ?? '').length > 48 ? '…' : ''}
            </span>
            <button type="button" className="pwa-confirm-pill-edit" aria-label="Editar origem" onClick={backToSearch}>
              ✎
            </button>
          </div>
          <div className="pwa-confirm-pill">
            <span className="pwa-confirm-pill-txt">{state.destPrimary}</span>
            <button type="button" className="pwa-confirm-pill-edit" aria-label="Editar destino" onClick={backToSearch}>
              ✎
            </button>
          </div>
        </div>
      </div>

      <div className="pwa-confirm-sheet">
        {routeErr ? <p className="pwa-sheet-error pwa-confirm-route-err">{routeErr}</p> : null}
        {!route && !routeErr ? <div className="pwa-confirm-skel">A calcular rota…</div> : null}

        <ul className="pwa-confirm-options">
          <li>
            <button
              type="button"
              className={`pwa-confirm-opt${selected === 'pop' ? ' pwa-confirm-opt--on' : ''}`}
              onClick={() => setSelected('pop')}
            >
              <span className="pwa-confirm-opt-ico" aria-hidden>
                🚗
              </span>
              <span className="pwa-confirm-opt-mid">
                <span className="pwa-confirm-opt-title">
                  Pop <span className="pwa-confirm-cap">👤4</span>
                </span>
                <span className="pwa-confirm-opt-sub">Mais barato</span>
              </span>
              <span className="pwa-confirm-opt-price">{formatBrl(prices.pop)}</span>
              <span className={`pwa-confirm-check${selected === 'pop' ? ' pwa-confirm-check--on' : ''}`} aria-hidden />
            </button>
          </li>
          <li>
            <button
              type="button"
              className={`pwa-confirm-opt${selected === 'moto' ? ' pwa-confirm-opt--on' : ''}`}
              onClick={() => setSelected('moto')}
            >
              <span className="pwa-confirm-opt-ico" aria-hidden>
                🏍
              </span>
              <span className="pwa-confirm-opt-mid">
                <span className="pwa-confirm-opt-title">
                  Moto <span className="pwa-confirm-cap">👤1</span>
                </span>
                <span className="pwa-confirm-opt-sub">Corridas de moto</span>
              </span>
              <span className="pwa-confirm-opt-price">{formatBrl(prices.moto)}</span>
              <span className={`pwa-confirm-check${selected === 'moto' ? ' pwa-confirm-check--on' : ''}`} aria-hidden />
            </button>
          </li>
          <li>
            <div
              role="button"
              tabIndex={0}
              className={`pwa-confirm-opt pwa-confirm-opt--neg${selected === 'negocia' ? ' pwa-confirm-opt--on' : ''}`}
              onClick={() => setSelected('negocia')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setSelected('negocia')
                }
              }}
            >
              <span className="pwa-confirm-opt-ico" aria-hidden>
                💵
              </span>
              <span className="pwa-confirm-opt-mid">
                <span className="pwa-confirm-opt-title">
                  Negocia <span className="pwa-confirm-cap">👤4</span>
                </span>
                <span className="pwa-confirm-opt-sub">Negocie e escolhe</span>
              </span>
              <span className="pwa-confirm-neg">
                <button
                  type="button"
                  className="pwa-confirm-neg-btn"
                  aria-label="Menos"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelected('negocia')
                    setNegociaVal((v) => Math.max(5, Math.round(((v ?? prices.negocia) - 1) * 100) / 100))
                  }}
                >
                  −
                </button>
                <span className="pwa-confirm-neg-val">
                  {formatBrl(negociaVal ?? prices.negocia).replace('R$', '').trim()}
                </span>
                <button
                  type="button"
                  className="pwa-confirm-neg-btn"
                  aria-label="Mais"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelected('negocia')
                    setNegociaVal((v) => Math.round(((v ?? prices.negocia) + 1) * 100) / 100)
                  }}
                >
                  +
                </button>
              </span>
              <span className={`pwa-confirm-check${selected === 'negocia' ? ' pwa-confirm-check--on' : ''}`} aria-hidden />
            </div>
          </li>
          <li>
            <button type="button" className="pwa-confirm-opt pwa-confirm-opt--static" disabled>
              <span className="pwa-confirm-opt-ico" aria-hidden>
                📦🏍
              </span>
              <span className="pwa-confirm-opt-mid">
                <span className="pwa-confirm-opt-title">Entrega Moto</span>
                <span className="pwa-confirm-opt-sub">40×34×36 cm · 10 kg</span>
              </span>
              <span className="pwa-confirm-opt-price pwa-confirm-opt-price--muted">{formatBrl(prices.entregaMoto)} ›</span>
            </button>
          </li>
          <li>
            <button type="button" className="pwa-confirm-opt pwa-confirm-opt--static" disabled>
              <span className="pwa-confirm-opt-ico" aria-hidden>
                📦🚗
              </span>
              <span className="pwa-confirm-opt-mid">
                <span className="pwa-confirm-opt-title">Entrega Carro</span>
                <span className="pwa-confirm-opt-sub">100×70×60 cm · 30 kg</span>
              </span>
              <span className="pwa-confirm-opt-price pwa-confirm-opt-price--muted">{formatBrl(prices.entregaCar)} ›</span>
            </button>
          </li>
        </ul>

        <div className="pwa-confirm-foot">
          <div className="pwa-confirm-payrow">
            <span className="pwa-confirm-pay-ico" aria-hidden>
              💵
            </span>
            <span>Dinheiro</span>
          </div>
          <button type="button" className="pwa-confirm-discount">
            Clique para descontos ›
          </button>
          <div className="pwa-confirm-cta-row">
            <div className="pwa-confirm-total">
              <span className="pwa-confirm-total-val">{formatBrl(displayPrice)}</span>
            </div>
            <button
              type="button"
              className="pwa-confirm-solicitar"
              disabled={sheetBusy || !route}
              onClick={() => {
                setMsg('')
                createMutation.mutate()
              }}
            >
              <span>Solicitar</span>
              <small>{selected === 'moto' ? 'Moto' : selected === 'negocia' ? 'Negocia' : 'Pop'}</small>
            </button>
          </div>
        </div>
        {msg ? <p className="pwa-sheet-error pwa-confirm-msg">{msg}</p> : null}
      </div>
    </div>
  )
}
