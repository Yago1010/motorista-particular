import { Loader } from '@googlemaps/js-api-loader'

let loadPromise: Promise<typeof google> | null = null

export function getGoogleMapsApiKey(): string {
  return String(import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '').trim()
}

export function hasGoogleMapsKey(): boolean {
  return getGoogleMapsApiKey().length > 0
}

/** Carrega Maps JS + Places + Geometry (stack típica Uber/99). */
export function loadGoogleMaps(): Promise<typeof google> {
  const key = getGoogleMapsApiKey()
  if (!key) {
    return Promise.reject(new Error('Chave Google Maps em falta (VITE_GOOGLE_MAPS_API_KEY).'))
  }
  if (!loadPromise) {
    const loader = new Loader({
      apiKey: key,
      version: 'weekly',
      libraries: ['places', 'geometry'],
      language: 'pt',
      region: 'BR',
    })
    loadPromise = loader.load()
  }
  return loadPromise
}
