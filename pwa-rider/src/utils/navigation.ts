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
}

async function fetchPhotonLocal(
  query: string,
  near: SearchNearOptions
): Promise<PlaceSuggestion[]> {
  const params = new URLSearchParams({
    q: query,
    lat: String(near.lat),
    lon: String(near.lng),
    limit: String(near.limit ?? 10),
    lang: 'pt',
  })
  const response = await fetch(`https://photon.komoot.io/api/?${params}`)
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

async function fetchNominatimBounded(
  query: string,
  near: SearchNearOptions
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

  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { 'User-Agent': 'ChamaNo12-PWA/1.0' },
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

async function fetchNominatimGlobal(query: string, limit = 10): Promise<PlaceSuggestion[]> {
  const params = new URLSearchParams({
    format: 'json',
    q: query,
    addressdetails: '1',
    limit: String(limit),
    'accept-language': 'pt-BR',
    countrycodes: 'br',
  })
  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { 'User-Agent': 'ChamaNo12-PWA/1.0' },
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

  try {
    const params = new URLSearchParams({ q: query.trim(), limit: String(near?.limit ?? 10) })
    if (near) {
      params.set('lat', String(near.lat))
      params.set('lng', String(near.lng))
      params.set('radius_km', String(wide ? 250 : near.radiusKm ?? 35))
      if (wide) params.set('wide', '1')
    }
    const response = await fetch(`/api/places/search?${params}`)
    if (response.ok) {
      const data = await response.json()
      if (Array.isArray(data.places) && data.places.length) {
        return data.places.map((place: PlaceSuggestion) => ({
          lat: Number(place.lat),
          lng: Number(place.lng),
          address: place.address,
          distance_m: place.distance_m,
        }))
      }
    }
  } catch {
    /* client fallback below */
  }

  if (near) {
    let places = await fetchPhotonLocal(query, near)
    if (places.length < 4) {
      places = dedupePlaces([
        ...places,
        ...(wide
          ? await fetchNominatimGlobal(query, near.limit ?? 10)
          : await fetchNominatimBounded(query, near)),
      ])
    }
    places = sortByDistance(places, near.lat, near.lng)
    if (!wide) {
      const maxM = (near.radiusKm ?? 35) * 1000
      const nearby = places.filter((p) => (p.distance_m ?? 0) <= maxM)
      if (nearby.length) places = nearby
    }
    return places.slice(0, near.limit ?? 10)
  }

  return fetchNominatimGlobal(query, 10)
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
