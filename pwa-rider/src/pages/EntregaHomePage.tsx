import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { acquireCurrentPosition, queryGeolocationPermission } from '../lib/geolocation'
import { formatRiderWhatsAppLine } from '../lib/riderContact'
import { reverseGeocode } from '../lib/reverseGeocode'
import { readSession } from '../lib/storage'
import type { EntregaRecipientNavState } from '../types/entregaFlow'

type Geo = { lat: number; lng: number }
const TEST_FALLBACK: Geo = { lat: -22.8832, lng: -42.0194 }

export function EntregaHomePage() {
  const navigate = useNavigate()
  const session = readSession()
  const [tab, setTab] = useState<'enviar' | 'receber'>('enviar')
  const [pickupPrimary, setPickupPrimary] = useState('A obter localização…')
  const [pickupBusy, setPickupBusy] = useState(true)
  const [receiverOrigin, setReceiverOrigin] = useState<Geo | null>(null)

  const isLocalTestHost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

  const pickupSecondary = formatRiderWhatsAppLine(session)

  useEffect(() => {
    let cancelled = false
    async function run() {
      if (!navigator.geolocation) {
        if (!cancelled) {
          setPickupPrimary('Localização indisponível neste dispositivo')
          setPickupBusy(false)
        }
        return
      }
      const perm = await queryGeolocationPermission()
      if (perm === 'denied' && isLocalTestHost) {
        if (!cancelled) setReceiverOrigin(TEST_FALLBACK)
        const label = await reverseGeocode(TEST_FALLBACK.lat, TEST_FALLBACK.lng)
        if (!cancelled) {
          setPickupPrimary(label || 'Localização de teste')
          setPickupBusy(false)
        }
        return
      }
      if (perm === 'denied') {
        if (!cancelled) {
          setPickupPrimary('Permite a localização para ver a recolha')
          setPickupBusy(false)
        }
        return
      }
      try {
        const pos = await acquireCurrentPosition()
        if (!cancelled) setReceiverOrigin({ lat: pos.lat, lng: pos.lng })
        const label = await reverseGeocode(pos.lat, pos.lng)
        if (!cancelled) {
          setPickupPrimary(label || 'A tua posição atual')
          setPickupBusy(false)
        }
      } catch {
        if (isLocalTestHost) {
          if (!cancelled) setReceiverOrigin(TEST_FALLBACK)
          const label = await reverseGeocode(TEST_FALLBACK.lat, TEST_FALLBACK.lng)
          if (!cancelled) {
            setPickupPrimary(label || 'Localização de teste')
            setPickupBusy(false)
          }
          return
        }
        if (!cancelled) {
          setPickupPrimary('Não foi possível obter a localização')
          setPickupBusy(false)
        }
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [isLocalTestHost])

  function goDestinatarioEnviar() {
    const next: EntregaRecipientNavState = {
      mode: 'enviar',
      pickupPrimary: pickupBusy ? 'A tua posição atual' : pickupPrimary,
      pickupSecondary,
    }
    if (receiverOrigin) next.originBias = receiverOrigin
    navigate('/entrega/destinatario', { state: next })
  }

  function goReceberRemetente() {
    const next: EntregaRecipientNavState = {
      mode: 'receber',
      pickupPrimary: pickupBusy ? 'A tua posição atual' : pickupPrimary,
      pickupSecondary,
      originBias: receiverOrigin ?? undefined,
    }
    navigate('/entrega/destinatario', { state: next })
  }

  return (
    <div className="pwa-ent">
      <header className="pwa-ent-herohead">
        <div className="pwa-ent-hero-avatar" aria-hidden>
          <span className="pwa-ent-hero-avatar-dot" />
        </div>
        <div className="pwa-ent-hero-greet">
          Olá, {session?.first_name ?? '!'}{' '}
          <span className="pwa-ent-hero-wave" aria-hidden>
            👋
          </span>
        </div>
      </header>

      <div className="pwa-ent-main">
        <div className="pwa-ent-tagline">
          <span className="pwa-ent-tagline-pre">VOCÊ PRECISA,</span>
          <span className="pwa-ent-tagline-row">
            <span className="pwa-ent-tagline-arrow" aria-hidden>
              ➜
            </span>
            <span className="pwa-ent-tagline-brand">Chama Entrega</span>
          </span>
        </div>

        <div className="pwa-ent-illus" aria-hidden>
          <span className="pwa-ent-illus-item">🏍📦</span>
          <span className="pwa-ent-illus-item">🚗📦</span>
        </div>

        <div className="pwa-ent-card">
          <div className="pwa-ent-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'enviar'}
              className={`pwa-ent-tab${tab === 'enviar' ? ' pwa-ent-tab--on' : ''}`}
              onClick={() => setTab('enviar')}
            >
              Enviar
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'receber'}
              className={`pwa-ent-tab${tab === 'receber' ? ' pwa-ent-tab--on' : ''}`}
              onClick={() => setTab('receber')}
            >
              Receber
            </button>
          </div>

          {tab === 'receber' ? (
            <>
              <button type="button" className="pwa-ent-row pwa-ent-row--action" onClick={goReceberRemetente}>
                <span className="pwa-ent-dot pwa-ent-dot--teal" aria-hidden />
                <span className="pwa-ent-row-mid">
                  <span className="pwa-ent-row-kicker">Enviar de</span>
                  <span className="pwa-ent-row-title pwa-ent-row-title--muted">Indica o remetente e o ponto de coleta no mapa</span>
                </span>
                <span className="pwa-ent-row-chev" aria-hidden>
                  ›
                </span>
              </button>

              <div className="pwa-ent-row pwa-ent-row--pickup" aria-label="Onde recebes a encomenda">
                <span className="pwa-ent-dot pwa-ent-dot--orange" aria-hidden />
                <span className="pwa-ent-row-mid">
                  <span className="pwa-ent-row-title">{pickupBusy ? 'A obter localização…' : pickupPrimary}</span>
                  <span className="pwa-ent-row-sub">{pickupSecondary}</span>
                </span>
              </div>
            </>
          ) : (
            <>
              <button type="button" className="pwa-ent-row pwa-ent-row--pickup">
                <span className="pwa-ent-dot pwa-ent-dot--teal" aria-hidden />
                <span className="pwa-ent-row-mid">
                  <span className="pwa-ent-row-title">{pickupPrimary}</span>
                  <span className="pwa-ent-row-sub">{pickupSecondary}</span>
                </span>
                <span className="pwa-ent-row-chev" aria-hidden>
                  ›
                </span>
              </button>

              <button type="button" className="pwa-ent-dropbox" onClick={goDestinatarioEnviar}>
                <span className="pwa-ent-dot pwa-ent-dot--orange" aria-hidden />
                <span className="pwa-ent-drop-ph">Entregar para</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
