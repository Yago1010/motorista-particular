export interface PlaceSuggestion {
  lat: number
  lng: number
  address: string
  distance_m?: number
}

export interface SearchNearOptions {
  lat: number
  lng: number
  limit?: number
  radiusKm?: number
  /** Busca ampla (cidades, bairros distantes) — não corta por raio curto */
  wide?: boolean
}

export interface SearchAddressOptions {
  wide?: boolean
  signal?: AbortSignal
  /** Atualiza a lista assim que a primeira fonte responder (UX mais fluida). */
  onPartial?: (places: PlaceSuggestion[]) => void
}

const SEARCH_CACHE = new Map<string, { at: number; places: PlaceSuggestion[] }>()
const SEARCH_CACHE_TTL_MS = 5 * 60 * 1000
const SEARCH_CACHE_MAX = 80

function searchCacheKey(query: string, near?: SearchNearOptions, wide?: boolean) {
  const n = near ? `${near.lat.toFixed(3)},${near.lng.toFixed(3)}` : 'global'
  return `${query.toLowerCase()}|${n}|${wide ? 'w' : 'l'}`
}

function readSearchCache(key: string): PlaceSuggestion[] | null {
  const hit = SEARCH_CACHE.get(key)
  if (!hit || Date.now() - hit.at > SEARCH_CACHE_TTL_MS) return null
  return hit.places
}

function writeSearchCache(key: string, places: PlaceSuggestion[]) {
  if (!places.length) return
  SEARCH_CACHE.set(key, { at: Date.now(), places })
  if (SEARCH_CACHE.size > SEARCH_CACHE_MAX) {
    const oldest = SEARCH_CACHE.keys().next().value
    if (oldest) SEARCH_CACHE.delete(oldest)
  }
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit & { timeoutMs?: number } = {}
): Promise<Response> {
  const { timeoutMs = 4500, signal, ...rest } = init
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)
  const onAbort = () => controller.abort()
  signal?.addEventListener('abort', onAbort)
  try {
    return await fetch(url, { ...rest, signal: controller.signal })
  } finally {
    window.clearTimeout(timer)
    signal?.removeEventListener('abort', onAbort)
  }
}

async function fetchPhotonLocal(
  query: string,
  near: SearchNearOptions,
  signal?: AbortSignal
): Promise<PlaceSuggestion[]> {
  const params = new URLSearchParams({
    q: query,
    lat: String(near.lat),
    lon: String(near.lng),
    limit: String(near.limit ?? 10),
    lang: 'pt',
  })
  const response = await fetchWithTimeout(`https://photon.komoot.io/api/?${params}`, {
    signal,
    timeoutMs: 2200,
  })
  if (!response.ok) return []
  const data = await response.json()
  if (!Array.isArray(data.features)) return []

  return data.features
    .map((feature: { geometry?: { coordinates?: number[] }; properties?: Record<string, string> }) => {
      const coords = feature.geometry?.coordinates
      const props = feature.properties ?? {}
      if (!coords?.length) return null
      if (props.country && !props.country.toLowerCase().includes('bra')) return null

      const parts = [props.name, props.street, props.housenumber, props.city || props.county, props.state].filter(
        Boolean
      )
      const unique = [...new Set(parts.map((p) => String(p).trim()).filter(Boolean))]
      const address = unique.slice(0, 4).join(', ')
      if (!address) return null

      const lat = coords[1]
      const lng = coords[0]
      return {
        lat,
        lng,
        address,
        distance_m: haversineDistance(near.lat, near.lng, lat, lng),
      } satisfies PlaceSuggestion
    })
    .filter(Boolean) as PlaceSuggestion[]
}

async function fetchApiPlaces(
  query: string,
  near?: SearchNearOptions,
  options?: SearchAddressOptions
): Promise<PlaceSuggestion[]> {
  const wide = options?.wide || near?.wide
  const params = new URLSearchParams({ q: query.trim(), limit: String(near?.limit ?? 10) })
  if (near) {
    params.set('lat', String(near.lat))
    params.set('lng', String(near.lng))
    params.set('radius_km', String(wide ? 120 : near.radiusKm ?? 35))
    if (wide) params.set('wide', '1')
  }
  const response = await fetchWithTimeout(`/api/places/search?${params}`, {
    signal: options?.signal,
    timeoutMs: 5000,
  })
  if (!response.ok) return []
  const data = await response.json()
  if (!Array.isArray(data.places)) return []
  return data.places.map((place: PlaceSuggestion) => ({
    lat: Number(place.lat),
    lng: Number(place.lng),
    address: place.address,
    distance_m: place.distance_m,
  }))
}

async function fetchNominatimBounded(
  query: string,
  near: SearchNearOptions,
  signal?: AbortSignal
): Promise<PlaceSuggestion[]> {
  const radiusKm = near.radiusKm ?? 35
  const dLat = radiusKm / 111
  const dLng = radiusKm / (111 * Math.max(Math.cos((near.lat * Math.PI) / 180), 0.2))
  const params = new URLSearchParams({
    format: 'json',
    q: query,
    addressdetails: '1',
    limit: String(near.limit ?? 10),
    'accept-language': 'pt-BR',
    countrycodes: 'br',
    viewbox: `${near.lng - dLng},${near.lat + dLat},${near.lng + dLng},${near.lat - dLat}`,
    bounded: '1',
  })

  const response = await fetchWithTimeout(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { 'User-Agent': 'ChamaNo12-PWA/1.0' },
    signal,
    timeoutMs: 5000,
  })
  if (!response.ok) return []
  const results = await response.json()
  if (!Array.isArray(results)) return []

  return results.map((place: { lat: string; lon: string; display_name: string }) => {
    const lat = parseFloat(place.lat)
    const lng = parseFloat(place.lon)
    return {
      lat,
      lng,
      address: place.display_name.split(',').slice(0, 3).join(', '),
      distance_m: haversineDistance(near.lat, near.lng, lat, lng),
    }
  })
}

function dedupePlaces(places: PlaceSuggestion[]): PlaceSuggestion[] {
  const seen = new Set<string>()
  return places.filter((place) => {
    const key = `${place.lat.toFixed(4)}|${place.lng.toFixed(4)}|${place.address.toLowerCase()}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function sortByDistance(places: PlaceSuggestion[], lat: number, lng: number): PlaceSuggestion[] {
  return [...places].sort((a, b) => {
    const da = a.distance_m ?? haversineDistance(lat, lng, a.lat, a.lng)
    const db = b.distance_m ?? haversineDistance(lat, lng, b.lat, b.lng)
    return da - db
  })
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(`/api/places/reverse?lat=${lat}&lng=${lng}`)
    if (response.ok) {
      const data = await response.json()
      if (data.address) return data.address
    }
  } catch {
    /* fallback below */
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=pt-BR`,
      { headers: { 'User-Agent': 'ChamaNo12-PWA/1.0' } }
    )
    const data = await response.json()
    if (data.display_name) return data.display_name.split(',').slice(0, 3).join(', ')
  } catch {
    /* ignore */
  }
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
}

async function fetchNominatimGlobal(query: string, limit = 10, signal?: AbortSignal): Promise<PlaceSuggestion[]> {
  const params = new URLSearchParams({
    format: 'json',
    q: query,
    addressdetails: '1',
    limit: String(limit),
    'accept-language': 'pt-BR',
    countrycodes: 'br',
  })
  const response = await fetchWithTimeout(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { 'User-Agent': 'ChamaNo12-PWA/1.0' },
    signal,
    timeoutMs: 5000,
  })
  if (!response.ok) return []
  const results = await response.json()
  if (!Array.isArray(results)) return []
  return results.map((place: { lat: string; lon: string; display_name: string }) => ({
    lat: parseFloat(place.lat),
    lng: parseFloat(place.lon),
    address: place.display_name.split(',').slice(0, 4).join(', '),
  }))
}

export async function searchAddresses(
  query: string,
  near?: SearchNearOptions,
  options?: SearchAddressOptions
): Promise<PlaceSuggestion[]> {
  if (!query.trim()) return []

  const wide = options?.wide || near?.wide
  const cacheKey = searchCacheKey(query, near, wide)
  const cached = readSearchCache(cacheKey)
  if (cached) {
    options?.onPartial?.(cached)
    return cached
  }

  const signal = options?.signal
  const emit = (places: PlaceSuggestion[]) => {
    if (places.length) options?.onPartial?.(places)
  }

  if (near) {
    const photonPromise = fetchPhotonLocal(query, near, signal).then((places) => {
      if (places.length) {
        const sorted = sortByDistance(places, near.lat, near.lng).slice(0, near.limit ?? 10)
        emit(sorted)
      }
      return places
    })
    const apiPromise = fetchApiPlaces(query, near, options)

    const [photon, api] = await Promise.allSettled([photonPromise, apiPromise])
    let places = dedupePlaces([
      ...(photon.status === 'fulfilled' ? photon.value : []),
      ...(api.status === 'fulfilled' ? api.value : []),
    ])

    if (places.length >= 1) {
      places = sortByDistance(places, near.lat, near.lng)
      if (!wide) {
        const maxM = (near.radiusKm ?? 35) * 1000
        const nearby = places.filter((p) => (p.distance_m ?? 0) <= maxM)
        if (nearby.length) places = nearby
      }
      const result = places.slice(0, near.limit ?? 10)
      writeSearchCache(cacheKey, result)
      emit(result)
      return result
    }

    // Fallback só se ambas falharem ou vierem vazias
    const fallback = wide
      ? await fetchNominatimGlobal(query, near.limit ?? 10, signal)
      : await fetchNominatimBounded(query, near, signal)
    places = sortByDistance(dedupePlaces([...places, ...fallback]), near.lat, near.lng)
    const result = places.slice(0, near.limit ?? 10)
    writeSearchCache(cacheKey, result)
    emit(result)
    return result
  }

  const result = await fetchNominatimGlobal(query, 10, signal)
  writeSearchCache(cacheKey, result)
  emit(result)
  return result
}

const RECENT_DEST_KEY = 'chama_recent_destinations'
const RECENT_DEST_MAX = 6

export function getRecentDestinations(): PlaceSuggestion[] {
  try {
    const raw = localStorage.getItem(RECENT_DEST_KEY)
    return raw ? (JSON.parse(raw) as PlaceSuggestion[]) : []
  } catch {
    return []
  }
}

export function filterPlacesByQuery(places: PlaceSuggestion[], query: string): PlaceSuggestion[] {
  const q = query.trim().toLowerCase()
  if (!q) return places
  return places.filter((p) => p.address.toLowerCase().includes(q))
}

export function saveRecentDestination(place: PlaceSuggestion) {
  try {
    const prev = getRecentDestinations().filter(
      (p) => `${p.lat.toFixed(4)}|${p.lng.toFixed(4)}` !== `${place.lat.toFixed(4)}|${place.lng.toFixed(4)}`
    )
    localStorage.setItem(RECENT_DEST_KEY, JSON.stringify([place, ...prev].slice(0, RECENT_DEST_MAX)))
  } catch {
    /* ignore */
  }
}

export function formatPlaceDistance(meters?: number): string | null {
  if (meters == null || meters <= 0) return null
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`
  return `${Math.round(meters)} m`
}

export function generateMockNearbyDrivers(
  centerLat: number,
  centerLng: number,
  count = 4
): Array<{ id: number; lat: number; lng: number; name: string }> {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    lat: centerLat + (Math.random() - 0.5) * 0.02,
    lng: centerLng + (Math.random() - 0.5) * 0.02,
    name: `Motorista ${i + 1}`,
  }))
}

export interface NearbyDriverMarker {
  id: string | number
  lat: number
  lng: number
  heading: number
}

/** Posições estáveis de carros ao redor do passageiro (estilo 99). */
export function generateStableNearbyDrivers(
  centerLat: number,
  centerLng: number,
  count = 7
): NearbyDriverMarker[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + 0.35
    const radius = 0.0025 + (i % 3) * 0.0018
    return {
      id: `nearby-${i}`,
      lat: centerLat + Math.cos(angle) * radius,
      lng: centerLng + Math.sin(angle) * radius,
      heading: Math.round((angle * 180) / Math.PI) + 90,
    }
  })
}

export function nudgeNearbyDrivers(
  drivers: NearbyDriverMarker[],
  centerLat: number,
  centerLng: number
): NearbyDriverMarker[] {
  return drivers.map((d, i) => {
    const angle = (i / drivers.length) * Math.PI * 2 + Date.now() * 0.00008
    const radius = 0.0025 + (i % 3) * 0.0018
    return {
      ...d,
      lat: centerLat + Math.cos(angle) * radius,
      lng: centerLng + Math.sin(angle) * radius,
      heading: Math.round((angle * 180) / Math.PI) + 90,
    }
  })
}

export const CANCELLATION_FEE = 5.0

export interface OsrmRouteResult {
  points: [number, number][]
  distance: number
  duration: number
}

export async function fetchOsrmRoute(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): Promise<OsrmRouteResult | null> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), 6500)
  try {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`,
      { signal: controller.signal }
    )
    if (!response.ok) return null
    const data = await response.json()
    if (!data.routes?.[0]) return null
    const route = data.routes[0]
    return {
      points: route.geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]),
      distance: route.distance,
      duration: route.duration,
    }
  } catch {
    return null
  } finally {
    window.clearTimeout(timer)
  }
}

export function formatDistance(meters: number): string {
  if (!meters || meters <= 0) return '—'
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`
  return `${Math.round(meters)} m`
}

export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '—'
  const mins = Math.max(1, Math.round(seconds / 60))
  if (mins < 60) return `${mins} min`
  const hours = Math.floor(mins / 60)
  const remaining = mins % 60
  return `${hours}h ${remaining}min`
}

export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** Rota aproximada quando OSRM não responde (distância × fator viário + tempo médio urbano). */
export function estimateFallbackRoute(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): OsrmRouteResult {
  const straight = haversineDistance(fromLat, fromLng, toLat, toLng)
  const distance = Math.round(straight * 1.38)
  const duration = Math.round(distance / (32 / 3.6))
  return {
    points: [
      [fromLat, fromLng],
      [toLat, toLng],
    ],
    distance,
    duration,
  }
}
