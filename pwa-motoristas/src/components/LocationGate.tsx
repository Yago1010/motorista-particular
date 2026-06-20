import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { MapPin, Navigation } from 'lucide-react'
import {
  markGeoGranted,
  requestCurrentPosition,
  resolveGeoPermissionState,
  type GeoCoords,
  type GeoPermissionState,
} from '@/utils/geolocation'

interface LocationGateProps {
  children: ReactNode
  onGranted?: (coords?: GeoCoords) => void
  logoUrl?: string
  appName?: string
  description?: string
}

export default function LocationGate({
  children,
  onGranted,
  logoUrl,
  appName,
  description,
}: LocationGateProps) {
  const [state, setState] = useState<GeoPermissionState>('checking')
  const [requesting, setRequesting] = useState(false)

  const grantAccess = useCallback(
    (notify: boolean, coords?: GeoCoords) => {
      markGeoGranted()
      setState('granted')
      setRequesting(false)
      if (notify) onGranted?.(coords)
    },
    [onGranted]
  )

  const probeLocation = useCallback(
    async (notify: boolean) => {
      setRequesting(true)
      try {
        const pos = await requestCurrentPosition()
        grantAccess(notify, {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        })
      } catch (err) {
        setRequesting(false)
        const geoErr = err as GeolocationPositionError
        if (geoErr?.code === GeolocationPositionError.PERMISSION_DENIED) {
          setState('denied')
        } else {
          setState('prompt')
        }
      }
    },
    [grantAccess]
  )

  useEffect(() => {
    let cancelled = false

    resolveGeoPermissionState().then(async (next) => {
      if (cancelled) return
      if (next === 'granted') {
        try {
          const pos = await requestCurrentPosition()
          if (cancelled) return
          markGeoGranted()
          setState('granted')
          onGranted?.({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          })
          return
        } catch {
          if (!cancelled) setState('prompt')
          return
        }
      }
      setState(next)
    })

    const timeout = window.setTimeout(() => {
      setState((current) => (current === 'checking' ? 'prompt' : current))
    }, 2000)

    if (navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'geolocation' as PermissionName })
        .then((result) => {
          result.onchange = () => {
            if (result.state === 'granted') void probeLocation(true)
            else if (result.state === 'denied') setState('denied')
            else setState('prompt')
          }
        })
        .catch(() => {})
    }

    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [grantAccess, probeLocation, onGranted])

  const requestLocation = () => probeLocation(true)
  const verifyAgain = () => probeLocation(true)

  if (state === 'granted') {
    return <div className="location-gate-home">{children}</div>
  }

  const defaultDescription =
    'Precisamos da sua localização para receber corridas, navegar no mapa e aparecer para os passageiros.'

  if (state === 'checking') {
    return (
      <div className="location-gate">
        <div className="location-gate-card">
          {logoUrl && <img src={logoUrl} alt="" className="location-gate-logo" />}
          <p>Verificando localização...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="location-gate">
      <div className="location-gate-card">
        {logoUrl && <img src={logoUrl} alt={appName || 'Chama'} className="location-gate-logo" />}
        {appName && <p className="location-gate-app">{appName}</p>}
        <div className="location-gate-icon">
          <MapPin className="h-8 w-8" />
        </div>
        <h2>Ative a localização</h2>
        <p>
          {state === 'unsupported'
            ? 'Seu navegador não suporta GPS. Use Chrome ou Safari no celular.'
            : state === 'insecure'
              ? 'A localização só funciona em HTTPS ou localhost. Abra o app pelo endereço seguro do servidor.'
              : state === 'denied'
                ? 'A localização está bloqueada. Libere nas configurações do navegador e toque em continuar.'
                : description || defaultDescription}
        </p>
        {state !== 'unsupported' && state !== 'insecure' && (
          <button type="button" className="chama-btn-primary location-gate-btn" onClick={requestLocation} disabled={requesting}>
            <Navigation className="h-4 w-4" />
            {requesting ? 'Aguarde...' : 'Permitir e continuar'}
          </button>
        )}
        {state === 'denied' && (
          <button type="button" className="chama-btn-outline location-gate-btn" onClick={verifyAgain} disabled={requesting}>
            Já liberei — continuar
          </button>
        )}
      </div>
    </div>
  )
}
