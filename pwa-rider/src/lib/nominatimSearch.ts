import { haversineKm } from './geodesic'

export type NominatimHit = {
  place_id: number
  lat: string
  lon: string
  display_name: string
  namedetails?: Record<string, string>
}

type AddressHit = {
  id: string
  primaryText: string
  secondaryText: string
  lat: number
  lng: number
  distanceKm?: number
}

type PhotonHit = {
  properties?: { osm_id?: number; name?: string; city?: string; state?: string; country?: string }
  geometry?: { coordinates?: [number, number] }
}

function withDistance(hit: Omit<AddressHit, 'distanceKm'>, origin?: { lat: number; lng: number }): AddressHit {
  return {
    ...hit,
    distanceKm: origin ? Math.round(haversineKm(origin, { lat: hit.lat, lng: hit.lng }) * 10) / 10 : undefined,
  }
}

function tokenize(v: string) {
  return v
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

function scoreAddress(query: string, row: AddressHit): number {
  const q = query.toLowerCase()
  const title = row.primaryText.toLowerCase()
  const sub = row.secondaryText.toLowerCase()
  let score = 0
  if (title === q) score += 120
  if (title.startsWith(q)) score += 70
  if (title.includes(q)) score += 45
  if (sub.includes(q)) score += 25
  const tokens = tokenize(query)
  for (const tk of tokens) {
    if (title.includes(tk)) score += 10
    if (sub.includes(tk)) score += 4
  }
  if (typeof row.distanceKm === 'number') {
    score += Math.max(0, 20 - row.distanceKm)
  }
  return score
}

async function searchPhoton(query: string, origin?: { lat: number; lng: number }): Promise<AddressHit[]> {
  const u = new URL('https://photon.komoot.io/api/')
  u.searchParams.set('q', query)
  u.searchParams.set('lang', 'pt')
  u.searchParams.set('limit', '10')
  const r = await fetch(u.toString(), { headers: { Accept: 'application/json' } })
  if (!r.ok) return []
  const j = (await r.json()) as { features?: PhotonHit[] }
  const list = j.features ?? []
  return list
    .map((f, idx) => {
      const coords = f.geometry?.coordinates
      if (!coords || coords.length < 2) return null
      const [lng, lat] = coords
      const name = f.properties?.name?.trim() || 'Local'
      const secondary = [f.properties?.city, f.properties?.state, f.properties?.country].filter(Boolean).join(', ')
      return withDistance(
        {
          id: `pho-${f.properties?.osm_id ?? idx}-${lat}-${lng}`,
          primaryText: name,
          secondaryText: secondary,
          lat,
          lng,
        },
        origin,
      )
    })
    .filter((x): x is AddressHit => !!x)
}

/** Pesquisa OSM (fallback sem chave Google). Respeita uso moderado da API pública. */
export async function searchNominatim(
  query: string,
  origin?: { lat: number; lng: number },
): Promise<AddressHit[]> {
  const q = query.trim()
  if (q.length < 3) return []
  const u = new URL('https://nominatim.openstreetmap.org/search')
  u.searchParams.set('format', 'jsonv2')
  u.searchParams.set('q', q)
  u.searchParams.set('limit', '12')
  u.searchParams.set('addressdetails', '1')
  u.searchParams.set('dedupe', '1')
  u.searchParams.set('countrycodes', 'br,pt')
  if (origin) {
    const west = String(origin.lng - 1.2)
    const east = String(origin.lng + 1.2)
    const north = String(origin.lat + 1.2)
    const south = String(origin.lat - 1.2)
    u.searchParams.set('viewbox', `${west},${north},${east},${south}`)
  }
  const r = await fetch(u.toString(), {
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'pt-BR,pt,en',
    },
  })
  const nomRows = r.ok ? ((await r.json()) as NominatimHit[]) : []
  const nomHits = nomRows.map((it) => {
    const lat = Number(it.lat)
    const lng = Number(it.lon)
    const primary = it.namedetails?.name ?? it.display_name.split(',')[0]?.trim() ?? 'Local'
    return withDistance({ id: `osm-${it.place_id}`, primaryText: primary, secondaryText: it.display_name, lat, lng }, origin)
  })

  const photonHits = await searchPhoton(q, origin).catch(() => [])
  const merged = [...nomHits, ...photonHits]
  const unique = new Map<string, AddressHit>()
  for (const row of merged) {
    const key = `${row.primaryText.toLowerCase()}|${Math.round(row.lat * 10000)}|${Math.round(row.lng * 10000)}`
    if (!unique.has(key)) unique.set(key, row)
  }
  return Array.from(unique.values())
    .sort((a, b) => scoreAddress(q, b) - scoreAddress(q, a))
    .slice(0, 14)
}
