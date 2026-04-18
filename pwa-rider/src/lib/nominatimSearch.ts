import { haversineKm } from './geodesic'

export type NominatimHit = {
  place_id: number
  lat: string
  lon: string
  display_name: string
  namedetails?: Record<string, string>
}

/** Pesquisa OSM (fallback sem chave Google). Respeita uso moderado da API pública. */
export async function searchNominatim(
  query: string,
  origin?: { lat: number; lng: number },
): Promise<
  {
    id: string
    primaryText: string
    secondaryText: string
    lat: number
    lng: number
    distanceKm?: number
  }[]
> {
  const q = query.trim()
  if (q.length < 3) return []
  const u = new URL('https://nominatim.openstreetmap.org/search')
  u.searchParams.set('format', 'jsonv2')
  u.searchParams.set('q', q)
  u.searchParams.set('limit', '8')
  u.searchParams.set('addressdetails', '1')
  const r = await fetch(u.toString(), {
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'pt-BR,pt,en',
    },
  })
  if (!r.ok) return []
  const rows = (await r.json()) as NominatimHit[]
  return rows.map((it) => {
    const lat = Number(it.lat)
    const lng = Number(it.lon)
    const primary = it.namedetails?.name ?? it.display_name.split(',')[0]?.trim() ?? 'Local'
    return {
      id: `osm-${it.place_id}`,
      primaryText: primary,
      secondaryText: it.display_name,
      lat,
      lng,
      distanceKm: origin ? Math.round(haversineKm(origin, { lat, lng }) * 10) / 10 : undefined,
    }
  })
}
