import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LocationPermissionScreen } from '../components/LocationPermissionScreen'
import { RideMap } from '../components/RideMap'
import { acquireCurrentPosition, queryGeolocationPermission } from '../lib/geolocation'
import { reverseGeocode } from '../lib/reverseGeocode'
import { readSession } from '../lib/storage'

type Geo = { lat: number; lng: number }
type LocationState = 'checking' | 'blocked' | 'ready'
const TEST_FALLBACK_ORIGIN: Geo = { lat: -22.8832, lng: -42.0194 }

export function HomeRidePage() {
  const navigate = useNavigate()
  const session = readSession()
  const [origin, setOrigin] = useState<Geo | null>(null)
  const [geoBusy, setGeoBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [pickupLabel, setPickupLabel] = useState('')
  const [locationState, setLocationState] = useState<LocationState>('checking')

  const isLocalTestHost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

  function enableLocalTestLocation(reason?: string) {
    setOrigin(TEST_FALLBACK_ORIGIN)
    setLocationState('ready')
    setMessage(reason ?? 'Modo de teste ativo: localização simulada em localhost.')
  }

  useEffect(() => {
    if (!origin) {
      setPickupLabel('')
      return
    }
    let cancelled = false
    void reverseGeocode(origin.lat, origin.lng).then((t) => {
      if (!cancelled) setPickupLabel(t || 'A tua posição atual (GPS)')
    })
    return () => {
      cancelled = true
    }
  }, [origin])

  async function resolveLocation() {
    if (!navigator.geolocation) {
      setMessage('Este browser não suporta geolocalização.')
      setLocationState('blocked')
      return
    }

    setGeoBusy(true)
    setMessage('')
    setLocationState('checking')

    const perm = await queryGeolocationPermission()
    if (perm === 'denied') {
      setGeoBusy(false)
      if (isLocalTestHost) {
        enableLocalTestLocation('GPS bloqueado. Modo de teste ativo: localização simulada em localhost.')
        return
      }
      setLocationState('blocked')
      setMessage('Localização bloqueada. Permite no browser e toca em “Ativar localização”.')
      return
    }

    try {
      const coords = await acquireCurrentPosition()
      setOrigin(coords)
      setLocationState('ready')
    } catch (e) {
      if (isLocalTestHost) {
        enableLocalTestLocation('GPS indisponível. Modo de teste ativo: localização simulada em localhost.')
        return
      }
      setLocationState('blocked')
      setMessage(e instanceof Error ? e.message : 'Falha ao obter localização.')
    } finally {
      setGeoBusy(false)
    }
  }

  useEffect(() => {
    void resolveLocation()
  }, [])

  function goToDestinationSearch() {
    if (!origin) return
    navigate('/destino', { state: { origin, pickupLabel } })
  }

  if (!session) {
    return null
  }

  if (locationState === 'checking') {
    return (
      <section className="pwa-home99 pwa-home99--loading">
        <div className="pwa-home99-loading">A verificar localização…</div>
      </section>
    )
  }

  if (locationState === 'blocked' || !origin) {
    return (
      <LocationPermissionScreen
        geoBusy={geoBusy}
        message={message}
        onRetryGps={() => {
          void resolveLocation()
        }}
      />
    )
  }

  return (
    <section className="pwa-home99">
      <article className="pwa-home99-maincard" aria-label="Mapa e destino">
        <div className="pwa-home99-maincard-map">
          <RideMap origin={origin} dest={null} className="pwa-map-inner pwa-map-inner--home" />
          <div className="pwa-home99-coupon" role="note">
            Cupom de 100% OFF expira em 1 dia(s)
          </div>
        </div>
        <div className="pwa-home99-maincard-search">
          <button type="button" className="pwa-home99-search" onClick={goToDestinationSearch} disabled={geoBusy}>
            <span className="pwa-home99-search-mglass" aria-hidden>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" />
                <path d="M16 16l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
            <span className="pwa-home99-search-label">Para onde vamos?</span>
          </button>
        </div>
      </article>

      <section className="pwa-home99-promo" aria-label="Segurança nas viagens">
        <div className="pwa-home99-promo-inner">
          <div className="pwa-home99-promo-shield" aria-hidden>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 3l8 4v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V7l8-4z"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinejoin="round"
              />
              <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="pwa-home99-promo-copy">
            <p>
              Suas <strong>viagens</strong> têm <strong>+50 recursos</strong> de segurança
            </p>
            <button type="button" className="pwa-home99-promo-cta" disabled={geoBusy} onClick={goToDestinationSearch}>
              Peça já
            </button>
          </div>
        </div>
        <div className="pwa-home99-promo-dots" aria-hidden>
          <span />
          <span className="is-active" />
          <span />
        </div>
      </section>

      <section className="pwa-home99-finance" aria-label="Praticidade nas finanças">
        <h3 className="pwa-home99-finance-title">Praticidade nas finanças</h3>
        <div className="pwa-home99-finance-scroll">
          <div className="pwa-home99-finance-card pwa-home99-finance-card--profit">
            <span className="pwa-home99-finance-badge">SUPER LUCRO</span>
            <div className="pwa-home99-finance-illus pwa-home99-finance-illus--bars" aria-hidden />
            <p className="pwa-home99-finance-card-hint">Ofertas para ti</p>
          </div>
          <button type="button" className="pwa-home99-finance-card pwa-home99-finance-card--pay" onClick={() => navigate('/pagar')}>
            <span className="pwa-home99-finance-badge pwa-home99-finance-badge--dark">Pagar</span>
            <div className="pwa-home99-finance-illus pwa-home99-finance-illus--phone" aria-hidden />
            <p className="pwa-home99-finance-card-hint">Carteira Chama</p>
          </button>
        </div>
      </section>

      <button type="button" className="pwa-home99-geo-refresh" disabled={geoBusy} onClick={() => void resolveLocation()}>
        {geoBusy ? 'A atualizar GPS…' : 'Atualizar localização'}
      </button>

      {pickupLabel ? <p className="pwa-home99-address">Origem: {pickupLabel}</p> : null}
      {message ? <p className="pwa-sheet-error">{message}</p> : null}
    </section>
  )
}
