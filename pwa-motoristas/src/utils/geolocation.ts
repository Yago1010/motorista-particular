export type GeoPermissionState = 'checking' | 'granted' | 'prompt' | 'denied' | 'unsupported' | 'insecure'

export const GEO_STORAGE_KEY = 'chama_location_granted'

export function isGeolocationSupported() {
  return typeof navigator !== 'undefined' && 'geolocation' in navigator
}

export function isSecureGeoContext() {
  if (typeof window === 'undefined') return true
  if (window.isSecureContext) return true
  const host = window.location.hostname
  return host === 'localhost' || host === '127.0.0.1'
}

export function markGeoGranted() {
  try {
    sessionStorage.setItem(GEO_STORAGE_KEY, '1')
  } catch {
    /* ignore */
  }
}

export function wasGeoGrantedBefore() {
  try {
    return sessionStorage.getItem(GEO_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export type GeoCoords = { lat: number; lng: number; accuracy?: number }

export function startLiveLocationTracking(
  onUpdate: (coords: GeoCoords) => void,
  onError?: (message: string) => void
): () => void {
  if (!isGeolocationSupported()) {
    onError?.('GPS indisponível neste dispositivo')
    return () => {}
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      onUpdate({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      })
    },
    (err) => onError?.(err.message || 'Não foi possível obter sua localização'),
    { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
  )

  const watchId = navigator.geolocation.watchPosition(
    (pos) => {
      onUpdate({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      })
    },
    (err) => onError?.(err.message || 'Erro ao atualizar localização'),
    { enableHighAccuracy: true, maximumAge: 4000, timeout: 15000 }
  )

  return () => navigator.geolocation.clearWatch(watchId)
}

export async function getCurrentLocation(): Promise<GeoCoords> {
  const pos = await requestCurrentPosition({ enableHighAccuracy: true, timeout: 20000, maximumAge: 0 })
  return {
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
    accuracy: pos.coords.accuracy,
  }
}

export function requestCurrentPosition(options?: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!isGeolocationSupported()) {
      reject(new Error('unsupported'))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0,
      ...options,
    })
  })
}

export async function resolveGeoPermissionState(): Promise<GeoPermissionState> {
  if (!isGeolocationSupported()) return 'unsupported'
  if (!isSecureGeoContext()) return 'insecure'

  if (navigator.permissions?.query) {
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName })
      if (result.state === 'granted') return 'granted'
      if (result.state === 'denied') return 'denied'
      return 'prompt'
    } catch {
      return wasGeoGrantedBefore() ? 'granted' : 'prompt'
    }
  }

  if (wasGeoGrantedBefore()) {
    try {
      await requestCurrentPosition({ maximumAge: 120000, timeout: 8000 })
      return 'granted'
    } catch {
      return 'prompt'
    }
  }

  return 'prompt'
}
