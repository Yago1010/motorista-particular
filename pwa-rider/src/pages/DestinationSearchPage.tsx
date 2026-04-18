import { useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { createPlacesSessionToken, resolvePlaceSelection, searchAddresses, type AddressPrediction } from '../lib/addressSearch'
import { hasGoogleMapsKey } from '../lib/googleMapsLoader'
import { readSession } from '../lib/storage'
import type { DestinationSearchNavState, RideConfirmNavState } from '../types/rideFlow'

const LS_HOME = 'pwa_chama_saved_home'
const LS_WORK = 'pwa_chama_saved_work'

function readSavedPoint(key: string): { lat: number; lng: number; label: string } | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const j = JSON.parse(raw) as { lat?: number; lng?: number; label?: string }
    if (typeof j.lat !== 'number' || typeof j.lng !== 'number') return null
    return { lat: j.lat, lng: j.lng, label: j.label ?? 'Guardado' }
  } catch {
    return null
  }
}

function shortenPickup(s: string, max = 42) {
  const t = s.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max - 1)}…`
}

export function DestinationSearchPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const session = readSession()
  const state = location.state as DestinationSearchNavState | null

  const [destQuery, setDestQuery] = useState('')
  const [predictions, setPredictions] = useState<AddressPrediction[]>([])
  const [searching, setSearching] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [hint, setHint] = useState('')
  const sessionRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null)
  const [placesReady, setPlacesReady] = useState(() => !hasGoogleMapsKey())

  useEffect(() => {
    if (!hasGoogleMapsKey()) return
    let cancelled = false
    void (async () => {
      try {
        const t = await createPlacesSessionToken()
        if (!cancelled) {
          sessionRef.current = t
          setPlacesReady(true)
        }
      } catch {
        if (!cancelled) setPlacesReady(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!state?.origin) return
    if (!placesReady && hasGoogleMapsKey()) return
    const q = destQuery.trim()
    if (q.length < 2) {
      setPredictions([])
      setSearching(false)
      return
    }
    setSearching(true)
    const id = window.setTimeout(() => {
      void searchAddresses(destQuery, state.origin, sessionRef.current)
        .then((rows) => {
          setPredictions(rows)
        })
        .catch(() => setPredictions([]))
        .finally(() => setSearching(false))
    }, 380)
    return () => window.clearTimeout(id)
  }, [destQuery, state, placesReady])

  async function onPick(pred: AddressPrediction) {
    if (!state?.origin) return
    setResolving(true)
    setHint('')
    try {
      const resolved = await resolvePlaceSelection(pred, sessionRef.current)
      const next: RideConfirmNavState = {
        origin: state.origin,
        pickupLabel: state.pickupLabel,
        dest: { lat: resolved.lat, lng: resolved.lng },
        destPrimary: resolved.primaryText,
        destSecondary: resolved.secondaryText,
      }
      navigate('/confirmar', { state: next })
    } catch (e) {
      setHint(e instanceof Error ? e.message : 'Não foi possível usar este endereço.')
    } finally {
      setResolving(false)
    }
  }

  function goSaved(key: string) {
    if (!state?.origin) return
    const p = readSavedPoint(key)
    if (!p) {
      setHint('Ainda não tens este endereço guardado. Escreve o destino abaixo.')
      return
    }
    const next: RideConfirmNavState = {
      origin: state.origin,
      pickupLabel: state.pickupLabel,
      dest: { lat: p.lat, lng: p.lng },
      destPrimary: key === LS_HOME ? 'Casa' : 'Trabalho',
      destSecondary: p.label,
    }
    navigate('/confirmar', { state: next })
  }

  if (!session) return null
  if (!state?.origin) {
    return <Navigate to="/home" replace />
  }

  const pickupShort = shortenPickup(state.pickupLabel || 'A tua localização')

  return (
    <div className="pwa-dest">
      <header className="pwa-dest-header">
        <button type="button" className="pwa-dest-back" aria-label="Voltar" onClick={() => navigate(-1)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button type="button" className="pwa-dest-passenger">
          <span className="pwa-dest-passenger-ico" aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.75" />
              <path d="M6 20v-1a4 4 0 014-4h4a4 4 0 014 4v1" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          </span>
          <span>Mudar o passageiro</span>
          <span className="pwa-dest-chev" aria-hidden>
            ▾
          </span>
        </button>
        <span className="pwa-dest-header-spacer" aria-hidden />
      </header>

      <div className="pwa-dest-card">
        <div className="pwa-dest-row pwa-dest-row--pickup">
          <span className="pwa-dest-dot pwa-dest-dot--pickup" aria-hidden />
          <div className="pwa-dest-field pwa-dest-field--readonly">{pickupShort}</div>
        </div>
        <div className="pwa-dest-divider" />
        <div className="pwa-dest-row pwa-dest-row--dest">
          <span className="pwa-dest-flag" aria-hidden>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 3v17.5M4 4.5h10l-2 4 2 4H4" />
            </svg>
          </span>
          <input
            className="pwa-dest-input"
            type="text"
            placeholder={hasGoogleMapsKey() && !placesReady ? 'A preparar pesquisa…' : 'Para onde vamos?'}
            value={destQuery}
            onChange={(e) => setDestQuery(e.target.value)}
            autoComplete="off"
            autoFocus
            aria-label="Destino"
            disabled={hasGoogleMapsKey() && !placesReady}
          />
          <button type="button" className="pwa-dest-addstop" aria-label="Adicionar paragem" title="Brevemente">
            +
          </button>
        </div>
      </div>

      <div className="pwa-dest-chips" role="list">
        <button type="button" className="pwa-dest-chip" onClick={() => goSaved(LS_HOME)}>
          <span className="pwa-dest-chip-ico" aria-hidden>
            ⌂
          </span>
          Casa
          <span className="pwa-dest-chip-more">›</span>
        </button>
        <button type="button" className="pwa-dest-chip" onClick={() => goSaved(LS_WORK)}>
          <span className="pwa-dest-chip-ico" aria-hidden>
            💼
          </span>
          Trabalho
          <span className="pwa-dest-chip-more">›</span>
        </button>
        <button type="button" className="pwa-dest-chip" onClick={() => setHint('Favoritos em breve.')}>
          <span className="pwa-dest-chip-ico" aria-hidden>
            ★
          </span>
          Favoritos
          <span className="pwa-dest-chip-more">›</span>
        </button>
      </div>

      {!hasGoogleMapsKey() ? (
        <p className="pwa-dest-apihint">
          Sugestões por OpenStreetMap. Para autocomplete estilo Uber/99, define <code>VITE_GOOGLE_MAPS_API_KEY</code> no
          ambiente (Places + Directions + Maps JavaScript).
        </p>
      ) : null}

      <div className="pwa-dest-list" role="listbox" aria-busy={searching || resolving}>
        {searching && destQuery.trim().length >= 2 ? <div className="pwa-dest-list-hint">A pesquisar…</div> : null}
        {predictions.map((p) => (
          <button
            key={p.id}
            type="button"
            className="pwa-dest-item"
            disabled={resolving}
            onClick={() => void onPick(p)}
          >
            <span className="pwa-dest-item-ico" aria-hidden>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 3c-3 4-6 7.5-6 11a6 6 0 1012 0c0-3.5-3-7-6-11z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="pwa-dest-item-text">
              <span className="pwa-dest-item-title">{p.primaryText}</span>
              <span className="pwa-dest-item-sub">{p.secondaryText}</span>
            </span>
            {p.distanceKm != null ? <span className="pwa-dest-item-km">{p.distanceKm} km</span> : null}
          </button>
        ))}
      </div>

      {hint ? <p className="pwa-sheet-error pwa-dest-hint">{hint}</p> : null}
    </div>
  )
}
