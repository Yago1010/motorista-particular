import { useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { createPlacesSessionToken, resolvePlaceSelection, searchAddresses, type AddressPrediction } from '../lib/addressSearch'
import { acquireCurrentPosition } from '../lib/geolocation'
import { hasGoogleMapsKey } from '../lib/googleMapsLoader'
import { reverseGeocode } from '../lib/reverseGeocode'
import { readSession } from '../lib/storage'
import { favoritePlaceNameSchema } from '../lib/validation/schemas'
import { firstFormError } from '../lib/validation/zodUtils'
import type { DestinationSearchNavState, RideConfirmNavState } from '../types/rideFlow'

const LS_HOME = 'pwa_chama_saved_home'
const LS_WORK = 'pwa_chama_saved_work'
const LS_RECENT_DEST = 'pwa_chama_recent_destinations'
const LS_FAVORITES = 'pwa_chama_saved_favorites'

type FavoritePlace = {
  id: string
  name: string
  primaryText: string
  secondaryText: string
  lat: number
  lng: number
}

type RecentDestination = {
  id: string
  primaryText: string
  secondaryText: string
  lat: number
  lng: number
  at: number
}

type OverlayMode = 'favorite-list' | 'favorite-search' | 'favorite-name' | 'home-search' | 'work-search' | null

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

function savePoint(key: string, p: { lat: number; lng: number; label: string }) {
  localStorage.setItem(key, JSON.stringify(p))
}

function shortenPickup(s: string, max = 42) {
  const t = s.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max - 1)}…`
}

function readRecentDestinations(): RecentDestination[] {
  try {
    const raw = localStorage.getItem(LS_RECENT_DEST)
    if (!raw) return []
    const list = JSON.parse(raw) as RecentDestination[]
    return Array.isArray(list) ? list.slice(0, 12) : []
  } catch {
    return []
  }
}

function pushRecentDestination(item: Omit<RecentDestination, 'id' | 'at'>) {
  const existing = readRecentDestinations()
  const next: RecentDestination = { ...item, id: `${Math.round(item.lat * 1e6)}:${Math.round(item.lng * 1e6)}`, at: Date.now() }
  const deduped = [next, ...existing.filter((x) => x.id !== next.id)].slice(0, 10)
  localStorage.setItem(LS_RECENT_DEST, JSON.stringify(deduped))
}

function readFavorites(): FavoritePlace[] {
  try {
    const raw = localStorage.getItem(LS_FAVORITES)
    if (!raw) return []
    const list = JSON.parse(raw) as FavoritePlace[]
    return Array.isArray(list) ? list.slice(0, 20) : []
  } catch {
    return []
  }
}

function writeFavorites(list: FavoritePlace[]) {
  localStorage.setItem(LS_FAVORITES, JSON.stringify(list.slice(0, 20)))
}

export function DestinationSearchPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const session = readSession()
  const state = location.state as DestinationSearchNavState | null

  const [origin, setOrigin] = useState(state?.origin ?? { lat: 0, lng: 0 })
  const [pickupLabel, setPickupLabel] = useState(state?.pickupLabel ?? 'A tua localização')
  const [originQuery, setOriginQuery] = useState('')
  const [destQuery, setDestQuery] = useState('')
  const [activeField, setActiveField] = useState<'origin' | 'dest'>('dest')
  const [predictions, setPredictions] = useState<AddressPrediction[]>([])
  const [searching, setSearching] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [recent, setRecent] = useState<RecentDestination[]>(() => readRecentDestinations())
  const [favorites, setFavorites] = useState<FavoritePlace[]>(() => readFavorites())
  const [hint, setHint] = useState('')

  const [overlayMode, setOverlayMode] = useState<OverlayMode>(null)
  const [overlayQuery, setOverlayQuery] = useState('')
  const [overlayPredictions, setOverlayPredictions] = useState<AddressPrediction[]>([])
  const [overlaySearching, setOverlaySearching] = useState(false)
  const [favoriteDraft, setFavoriteDraft] = useState<{ lat: number; lng: number; primary: string; secondary: string } | null>(null)
  const [favoriteName, setFavoriteName] = useState('')

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
    if (!state?.origin || overlayMode !== null) return
    if (!placesReady && hasGoogleMapsKey()) return
    const q = (activeField === 'origin' ? originQuery : destQuery).trim()
    if (q.length < 2) {
      setPredictions([])
      setSearching(false)
      return
    }
    setSearching(true)
    const id = window.setTimeout(() => {
      void searchAddresses(q, origin, sessionRef.current)
        .then((rows) => setPredictions(rows))
        .catch(() => setPredictions([]))
        .finally(() => setSearching(false))
    }, 320)
    return () => window.clearTimeout(id)
  }, [originQuery, destQuery, activeField, origin, state, placesReady, overlayMode])

  useEffect(() => {
    if (overlayMode == null || overlayMode === 'favorite-list' || overlayMode === 'favorite-name') return
    if (!placesReady && hasGoogleMapsKey()) return
    const q = overlayQuery.trim()
    if (q.length < 2) {
      setOverlayPredictions([])
      setOverlaySearching(false)
      return
    }
    setOverlaySearching(true)
    const id = window.setTimeout(() => {
      void searchAddresses(q, origin, sessionRef.current)
        .then((rows) => setOverlayPredictions(rows))
        .catch(() => setOverlayPredictions([]))
        .finally(() => setOverlaySearching(false))
    }, 280)
    return () => window.clearTimeout(id)
  }, [overlayMode, overlayQuery, origin, placesReady])

  async function onPickMain(pred: AddressPrediction) {
    setResolving(true)
    setHint('')
    try {
      const resolved = await resolvePlaceSelection(pred, sessionRef.current)
      if (activeField === 'origin') {
        setOrigin({ lat: resolved.lat, lng: resolved.lng })
        setPickupLabel(resolved.secondaryText || resolved.primaryText)
        setOriginQuery('')
        setActiveField('dest')
        setHint('Origem atualizada. Agora escolhe o destino.')
        return
      }
      pushRecentDestination({
        primaryText: resolved.primaryText,
        secondaryText: resolved.secondaryText || resolved.primaryText,
        lat: resolved.lat,
        lng: resolved.lng,
      })
      setRecent(readRecentDestinations())
      navigate('/confirmar', {
        state: {
          origin,
          pickupLabel,
          dest: { lat: resolved.lat, lng: resolved.lng },
          destPrimary: resolved.primaryText,
          destSecondary: resolved.secondaryText,
        } satisfies RideConfirmNavState,
      })
    } catch (e) {
      setHint(e instanceof Error ? e.message : 'Não foi possível usar este endereço.')
    } finally {
      setResolving(false)
    }
  }

  async function onPickOverlay(pred: AddressPrediction) {
    setResolving(true)
    try {
      const resolved = await resolvePlaceSelection(pred, sessionRef.current)
      if (overlayMode === 'home-search' || overlayMode === 'work-search') {
        const key = overlayMode === 'home-search' ? LS_HOME : LS_WORK
        savePoint(key, { lat: resolved.lat, lng: resolved.lng, label: resolved.secondaryText || resolved.primaryText })
        setOverlayMode(null)
        setOverlayQuery('')
        setOverlayPredictions([])
        setHint(overlayMode === 'home-search' ? 'Casa guardada.' : 'Trabalho guardado.')
        return
      }
      if (overlayMode === 'favorite-search') {
        setFavoriteDraft({
          lat: resolved.lat,
          lng: resolved.lng,
          primary: resolved.primaryText,
          secondary: resolved.secondaryText || resolved.primaryText,
        })
        setFavoriteName(resolved.primaryText)
        setOverlayMode('favorite-name')
      }
    } catch (e) {
      setHint(e instanceof Error ? e.message : 'Falha ao resolver endereço.')
    } finally {
      setResolving(false)
    }
  }

  function saveFavorite() {
    if (!favoriteDraft) return
    const rawName = favoriteName.trim() || favoriteDraft.primary
    const nameCheck = favoritePlaceNameSchema.safeParse(rawName)
    if (!nameCheck.success) {
      setHint(firstFormError(nameCheck.error))
      return
    }
    const name = nameCheck.data
    const newFav: FavoritePlace = {
      id: `fav-${Date.now()}`,
      name,
      primaryText: favoriteDraft.primary,
      secondaryText: favoriteDraft.secondary,
      lat: favoriteDraft.lat,
      lng: favoriteDraft.lng,
    }
    const merged = [newFav, ...favorites.filter((f) => f.id !== newFav.id)].slice(0, 20)
    writeFavorites(merged)
    setFavorites(merged)
    setOverlayMode('favorite-list')
    setFavoriteDraft(null)
    setFavoriteName('')
  }

  function goSaved(kind: 'home' | 'work') {
    const key = kind === 'home' ? LS_HOME : LS_WORK
    const saved = readSavedPoint(key)
    if (!saved) {
      setOverlayMode(kind === 'home' ? 'home-search' : 'work-search')
      setOverlayQuery('')
      setOverlayPredictions([])
      return
    }
    navigate('/confirmar', {
      state: {
        origin,
        pickupLabel,
        dest: { lat: saved.lat, lng: saved.lng },
        destPrimary: kind === 'home' ? 'Casa' : 'Trabalho',
        destSecondary: saved.label,
      } satisfies RideConfirmNavState,
    })
  }

  function goFavorite(f: FavoritePlace) {
    navigate('/confirmar', {
      state: {
        origin,
        pickupLabel,
        dest: { lat: f.lat, lng: f.lng },
        destPrimary: f.name,
        destSecondary: f.secondaryText,
      } satisfies RideConfirmNavState,
    })
  }

  function removeFavorite(id: string) {
    const next = favorites.filter((f) => f.id !== id)
    writeFavorites(next)
    setFavorites(next)
  }

  function clearHistoryAndSaved() {
    localStorage.removeItem(LS_RECENT_DEST)
    localStorage.removeItem(LS_HOME)
    localStorage.removeItem(LS_WORK)
    setRecent([])
    setHint('Limpeza concluída: últimos destinos + Casa/Trabalho.')
  }

  function goRecent(item: RecentDestination) {
    navigate('/confirmar', {
      state: {
        origin,
        pickupLabel,
        dest: { lat: item.lat, lng: item.lng },
        destPrimary: item.primaryText,
        destSecondary: item.secondaryText,
      } satisfies RideConfirmNavState,
    })
  }

  async function useCurrentLocationAsOrigin() {
    setHint('')
    try {
      const coords = await acquireCurrentPosition()
      setOrigin(coords)
      const name = await reverseGeocode(coords.lat, coords.lng)
      setPickupLabel(name || 'A tua localização atual')
      setOriginQuery('')
      setActiveField('dest')
      setHint('Origem definida com o endereço atual.')
    } catch (e) {
      setHint(e instanceof Error ? e.message : 'Não foi possível obter localização atual.')
    }
  }

  function swapOriginAndDestination() {
    const currentOrigin = (activeField === 'origin' ? originQuery : pickupLabel).trim()
    const currentDest = destQuery.trim()
    if (!currentDest) {
      setHint('Preenche um destino para inverter.')
      return
    }
    setDestQuery(currentOrigin)
    setOriginQuery(currentDest)
    setPickupLabel(currentDest)
    setPredictions([])
    setActiveField('origin')
    setHint('Origem e destino invertidos.')
  }

  if (!session) return null
  if (!state?.origin) return <Navigate to="/home" replace />

  const pickupShort = shortenPickup(pickupLabel || 'A tua localização')
  const homeSaved = readSavedPoint(LS_HOME)
  const workSaved = readSavedPoint(LS_WORK)
  const showOverlaySearch = overlayMode === 'favorite-search' || overlayMode === 'home-search' || overlayMode === 'work-search'

  return (
    <div className="pwa-dest">
      <header className="pwa-dest-header">
        <button type="button" className="pwa-dest-back" aria-label="Voltar" onClick={() => navigate(-1)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button type="button" className="pwa-dest-passenger">
          <span className="pwa-dest-passenger-ico" aria-hidden>◉</span>
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
          <input
            className="pwa-dest-field-input"
            type="text"
            value={activeField === 'origin' ? originQuery : pickupShort}
            onFocus={() => setActiveField('origin')}
            onChange={(e) => {
              setActiveField('origin')
              setOriginQuery(e.target.value)
            }}
            placeholder="Origem (atual)"
          />
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
            onFocus={() => setActiveField('dest')}
            onChange={(e) => {
              setActiveField('dest')
              setDestQuery(e.target.value)
            }}
            autoComplete="off"
            autoFocus
            disabled={hasGoogleMapsKey() && !placesReady}
          />
        </div>
      </div>

      <div className="pwa-dest-chips">
        <button type="button" className="pwa-dest-chip" onClick={() => goSaved('home')}>
          ⌂ Casa {!homeSaved ? <span className="pwa-dest-chip-tag">definir</span> : null}
        </button>
        <button type="button" className="pwa-dest-chip" onClick={() => goSaved('work')}>
          💼 Trabalho {!workSaved ? <span className="pwa-dest-chip-tag">definir</span> : null}
        </button>
        <button type="button" className="pwa-dest-chip" onClick={() => setOverlayMode('favorite-list')}>
          ★ Favoritos {favorites.length > 0 ? <span className="pwa-dest-chip-count">{favorites.length}</span> : null}
        </button>
      </div>

      <div className="pwa-dest-tools">
        <button type="button" className="pwa-dest-tool" onClick={swapOriginAndDestination}>
          Trocar origem/destino
        </button>
        <button type="button" className="pwa-dest-tool" onClick={() => void useCurrentLocationAsOrigin()}>
          Usar localização atual
        </button>
        <button
          type="button"
          className="pwa-dest-tool"
          onClick={() => {
            setOriginQuery('')
            setDestQuery('')
            setPredictions([])
            clearHistoryAndSaved()
          }}
        >
          Limpar
        </button>
      </div>

      {recent.length > 0 ? (
        <section className="pwa-dest-recent">
          <div className="pwa-dest-recent-head">Últimos destinos</div>
          <div className="pwa-dest-recent-list">
            {recent.slice(0, 5).map((item) => (
              <button key={item.id} type="button" className="pwa-dest-recent-item" onClick={() => goRecent(item)}>
                <span className="pwa-dest-recent-title">{item.primaryText}</span>
                <span className="pwa-dest-recent-sub">{item.secondaryText}</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <div className="pwa-dest-list" role="listbox" aria-busy={searching || resolving}>
        {searching ? <div className="pwa-dest-list-hint">A pesquisar…</div> : null}
        {!searching && predictions.length === 0 ? <div className="pwa-dest-list-hint">Digite o destino para ver sugestões.</div> : null}
        {predictions.map((p) => (
          <button key={p.id} type="button" className="pwa-dest-item" disabled={resolving} onClick={() => void onPickMain(p)}>
            <span className="pwa-dest-item-ico" aria-hidden>⌂</span>
            <span className="pwa-dest-item-text">
              <span className="pwa-dest-item-title">{p.primaryText}</span>
              <span className="pwa-dest-item-sub">{p.secondaryText}</span>
            </span>
            {p.distanceKm != null ? <span className="pwa-dest-item-km">{p.distanceKm} km</span> : null}
          </button>
        ))}
      </div>

      {hint ? <p className="pwa-sheet-error pwa-dest-hint">{hint}</p> : null}

      {overlayMode === 'favorite-list' ? (
        <section className="pwa-fav-modal" aria-label="Favoritos">
          <div className="pwa-fav-modal-sheet">
            <header className="pwa-fav-modal-head">
              <button type="button" className="pwa-fav-modal-close" onClick={() => setOverlayMode(null)}>
                ✕
              </button>
              <h2>Favoritos</h2>
            </header>
            {favorites.length === 0 ? (
              <div className="pwa-fav-empty">
                <div className="pwa-fav-empty-ico" aria-hidden>
                  ★
                </div>
                <p className="pwa-fav-empty-title">Locais favoritos</p>
                <p className="pwa-fav-empty-sub">É mais facil chegar a um destino se ele ja estiver salvo</p>
              </div>
            ) : (
              <ul className="pwa-dest-fave-list pwa-dest-fave-list--modal">
                {favorites.map((f) => (
                  <li key={f.id} className="pwa-dest-fave-row">
                    <button type="button" className="pwa-dest-fave-go" onClick={() => goFavorite(f)}>
                      <span className="pwa-dest-fave-name">{f.name}</span>
                      <span className="pwa-dest-fave-sub">{f.secondaryText}</span>
                    </button>
                    <button type="button" className="pwa-dest-fave-remove" onClick={() => removeFavorite(f.id)}>
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button type="button" className="pwa-fav-modal-fab" onClick={() => setOverlayMode('favorite-search')}>
              +
            </button>
            <button type="button" className="pwa-fav-modal-add" onClick={() => setOverlayMode('favorite-search')}>
              Adicionar favorito
            </button>
          </div>
        </section>
      ) : null}

      {showOverlaySearch ? (
        <section className="pwa-fav-modal" aria-label="Pesquisar endereço">
          <div className="pwa-fav-modal-sheet">
            <header className="pwa-fav-modal-head">
              <button
                type="button"
                className="pwa-fav-modal-close"
                onClick={() => setOverlayMode(overlayMode === 'favorite-search' ? 'favorite-list' : null)}
              >
                ←
              </button>
              <h2>{overlayMode === 'home-search' ? 'Casa' : overlayMode === 'work-search' ? 'Trabalho' : 'Favoritos'}</h2>
            </header>
            <div className="pwa-fav-search-row">
              <span className="pwa-fav-search-ico" aria-hidden>
                {overlayMode === 'favorite-search' ? '★' : ''}
              </span>
              <input
                className="pwa-fav-search-input"
                placeholder="Insira o endereço"
                value={overlayQuery}
                onChange={(e) => setOverlayQuery(e.target.value)}
                autoFocus
              />
              <button type="button" className="pwa-fav-search-cancel" onClick={() => setOverlayMode(overlayMode === 'favorite-search' ? 'favorite-list' : null)}>
                Cancelar
              </button>
            </div>
            <div className="pwa-dest-list pwa-dest-list--modal">
              {overlaySearching ? <div className="pwa-dest-list-hint">A pesquisar…</div> : null}
              {!overlaySearching && overlayPredictions.length === 0 ? <div className="pwa-dest-list-hint">Digite para buscar endereços.</div> : null}
              {overlayPredictions.map((p) => (
                <button key={p.id} type="button" className="pwa-dest-item" onClick={() => void onPickOverlay(p)}>
                  <span className="pwa-dest-item-ico" aria-hidden>
                    {overlayMode === 'home-search' ? '⌂' : overlayMode === 'work-search' ? '⌂' : '🔥'}
                  </span>
                  <span className="pwa-dest-item-text">
                    <span className="pwa-dest-item-title">{p.primaryText}</span>
                    <span className="pwa-dest-item-sub">{p.secondaryText}</span>
                  </span>
                  {p.distanceKm != null ? <span className="pwa-dest-item-km">{p.distanceKm}km</span> : null}
                </button>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {overlayMode === 'favorite-name' && favoriteDraft ? (
        <section className="pwa-fav-modal" aria-label="Nomear favorito">
          <div className="pwa-fav-modal-sheet">
            <header className="pwa-fav-modal-head">
              <button type="button" className="pwa-fav-modal-close" onClick={() => setOverlayMode('favorite-search')}>
                ←
              </button>
              <h2>Nome do local</h2>
            </header>
            <div className="pwa-fav-name-address">{favoriteDraft.secondary}</div>
            <div className="pwa-fav-name-row">
              <input className="pwa-fav-name-input" placeholder="Nome do local" value={favoriteName} onChange={(e) => setFavoriteName(e.target.value)} />
            </div>
            <div className="pwa-fav-name-actions">
              <button type="button" className="pwa-fav-modal-add" onClick={saveFavorite}>
                Salvar
              </button>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  )
}
