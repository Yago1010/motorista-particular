import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { MapPin, Navigation } from 'lucide-react'
import {
  markGeoGranted,
  requestCurrentPosition,
  resolveGeoPermissionState,
  wasGeoGrantedBefore,
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
  const onGrantedRef = useRef(onGranted)
  const notifiedRef = useRef(false)
  const [state, setState] = useState<GeoPermissionState>(() =>
    wasGeoGrantedBefore() ? 'granted' : 'checking'
  )
  const [requesting, setRequesting] = useState(false)

  useEffect(() => {
    onGrantedRef.current = onGranted
  }, [onGranted])

  const notifyOnce = useCallback((coords?: GeoCoords) => {
    if (notifiedRef.current) return
    notifiedRef.current = true
    onGrantedRef.current?.(coords)
  }, [])

  const grantAccess = useCallback(
    (coords?: GeoCoords) => {
      markGeoGranted()
      setState('granted')
      setRequesting(false)
      notifyOnce(coords)
    },
    [notifyOnce]
  )

  const probeLocation = useCallback(
    async (notify: boolean) => {
      setRequesting(true)
      try {
        const pos = await requestCurrentPosition({ maximumAge: 30000 })
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }
        if (notify) {
          grantAccess(coords)
        } else {
          markGeoGranted()
          setState('granted')
          setRequesting(false)
          notifyOnce(coords)
        }
      } catch (err) {
        setRequesting(false)
        const geoErr = err as GeolocationPositionError
        if (geoErr?.code === GeolocationPositionError.PERMISSION_DENIED) {
          setState('denied')
        } else if (wasGeoGrantedBefore()) {
          setState('granted')
        } else {
          setState('prompt')
        }
      }
    },
    [grantAccess, notifyOnce]
  )

  useEffect(() => {
    let cancelled = false

    if (wasGeoGrantedBefore()) {
      void probeLocation(false)
      return () => {
        cancelled = true
      }
    }

    resolveGeoPermissionState().then(async (next) => {
      if (cancelled) return
      if (next === 'granted') {
        await probeLocation(false)
        return
      }
      setState(next)
    })

    const timeout = window.setTimeout(() => {
      setState((current) => (current === 'checking' ? 'prompt' : current))
    }, 1500)

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
  }, [probeLocation])

  const requestLocation = () => probeLocation(true)
  const verifyAgain = () => probeLocation(true)

  if (state === 'granted') {
    return <div className="location-gate-home">{children}</div>
  }

  const defaultDescription =
    'Precisamos da sua localização para mostrar motoristas por perto, calcular o valor da corrida e buscar o ponto de embarque.'

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
