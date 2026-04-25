import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { createPlacesSessionToken, resolvePlaceSelection, searchAddresses, type AddressPrediction } from '../lib/addressSearch'
import { hasGoogleMapsKey } from '../lib/googleMapsLoader'
import { pushRecentDestination } from '../lib/recentDestinations'
import { readSession } from '../lib/storage'
import type { EntregaColetaPoint, EntregaColetaSearchNavState, EntregaRecipientNavState } from '../types/entregaFlow'

export function EntregaColetaSearchPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const session = readSession()
  const nav = location.state as EntregaColetaSearchNavState | null

  const [query, setQuery] = useState('')
  const [predictions, setPredictions] = useState<AddressPrediction[]>([])
  const [searching, setSearching] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [hint, setHint] = useState('')
  const sessionRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null)
  const [placesReady, setPlacesReady] = useState(() => !hasGoogleMapsKey())

  const pageTitle = useMemo(
    () => (nav?.purpose === 'destino' ? 'Endereço de entrega' : 'Endereço de coleta'),
    [nav?.purpose],
  )

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
    if (!nav?.origin) return
    if (!placesReady && hasGoogleMapsKey()) return
    const q = query.trim()
    if (q.length < 2) {
      setPredictions([])
      setSearching(false)
      return
    }
    setSearching(true)
    const id = window.setTimeout(() => {
      void searchAddresses(q, nav.origin, sessionRef.current)
        .then((rows) => setPredictions(rows))
        .catch(() => setPredictions([]))
        .finally(() => setSearching(false))
    }, 320)
    return () => window.clearTimeout(id)
  }, [query, nav, placesReady])

  async function onPick(p: AddressPrediction) {
    if (!nav?.recipientSnapshot) return
    setResolving(true)
    setHint('')
    try {
      const resolved = await resolvePlaceSelection(p, sessionRef.current)
      pushRecentDestination({
        primaryText: resolved.primaryText,
        secondaryText: resolved.secondaryText || resolved.primaryText,
        lat: resolved.lat,
        lng: resolved.lng,
      })
      const point: EntregaColetaPoint = {
        lat: resolved.lat,
        lng: resolved.lng,
        primary: resolved.primaryText,
        secondary: resolved.secondaryText || resolved.primaryText,
      }
      const snap = nav.recipientSnapshot
      const next: EntregaRecipientNavState =
        nav.purpose === 'destino'
          ? { ...snap, destino: point }
          : { ...snap, coleta: point }
      navigate('/entrega/destinatario', { replace: true, state: next })
    } catch (e) {
      setHint(e instanceof Error ? e.message : 'Não foi possível usar este endereço.')
    } finally {
      setResolving(false)
    }
  }

  if (!session) return null
  if (
    !nav?.origin ||
    typeof nav.origin.lat !== 'number' ||
    typeof nav.origin.lng !== 'number' ||
    !nav.recipientSnapshot?.pickupPrimary
  ) {
    return <Navigate to="/entrega" replace />
  }

  return (
    <div className="pwa-ent-coleta">
      <header className="pwa-ent-coleta-head">
        <button type="button" className="pwa-ent-coleta-back" aria-label="Voltar" onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="pwa-ent-coleta-title">{pageTitle}</h1>
      </header>
      <div className="pwa-ent-coleta-body">
        <input
          className="pwa-ent-coleta-input"
          placeholder={hasGoogleMapsKey() && !placesReady ? 'A preparar mapa…' : 'Pesquisar no mapa'}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={hasGoogleMapsKey() && !placesReady}
        />
        {hint ? <p className="pwa-sheet-error pwa-ent-coleta-hint">{hint}</p> : null}
        <div className="pwa-ent-coleta-list">
          {searching ? <div className="pwa-dest-list-hint">A pesquisar…</div> : null}
          {!searching && predictions.length === 0 && query.trim().length >= 2 ? (
            <div className="pwa-dest-list-hint">Sem resultados.</div>
          ) : null}
          {predictions.map((p) => (
            <button key={p.id} type="button" className="pwa-dest-item" disabled={resolving} onClick={() => void onPick(p)}>
              <span className="pwa-dest-item-text">
                <span className="pwa-dest-item-title">{p.primaryText}</span>
                <span className="pwa-dest-item-sub">{p.secondaryText}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
