import { haversineKm } from './geodesic'
import { hasGoogleMapsKey, loadGoogleMaps } from './googleMapsLoader'

export type RouteResult = {
  path: [number, number][]
  distanceM: number
  durationS: number
}

function decodeGoogleOverviewPath(overview: google.maps.LatLng[] | undefined): [number, number][] {
  if (!overview?.length) return []
  return overview.map((ll) => [ll.lat(), ll.lng()] as [number, number])
}

async function routeGoogle(
  origin: { lat: number; lng: number },
  dest: { lat: number; lng: number },
): Promise<RouteResult> {
  await loadGoogleMaps()
  const svc = new google.maps.DirectionsService()
  const result = await new Promise<google.maps.DirectionsResult | null>((resolve, reject) => {
    svc.route(
      {
        origin: { lat: origin.lat, lng: origin.lng },
        destination: { lat: dest.lat, lng: dest.lng },
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: false,
      },
      (res, status) => {
        if (status === google.maps.DirectionsStatus.OK && res) resolve(res)
        else reject(new Error(`Directions: ${String(status)}`))
      },
    )
  })
  const leg = result?.routes?.[0]?.legs?.[0]
  const overview = result?.routes?.[0]?.overview_path
  const path = decodeGoogleOverviewPath(overview)
  if (!leg || path.length < 2) {
    throw new Error('Rota inválida.')
  }
  return {
    path,
    distanceM: leg.distance?.value ?? 0,
    durationS: leg.duration?.value ?? 0,
  }
}

/** OSRM público (fallback sem Google Directions). */
async function routeOsrm(
  origin: { lat: number; lng: number },
  dest: { lat: number; lng: number },
): Promise<RouteResult> {
  const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson`
  const r = await fetch(url)
  if (!r.ok) throw new Error('Falha na rota (OSRM).')
  const j = (await r.json()) as {
    routes?: { distance: number; duration: number; geometry: { coordinates: [number, number][] } }[]
  }
  const rt = j.routes?.[0]
  if (!rt?.geometry?.coordinates?.length) throw new Error('Sem geometria de rota.')
  const path: [number, number][] = rt.geometry.coordinates.map(([lng, lat]) => [lat, lng])
  return {
    path,
    distanceM: rt.distance,
    durationS: rt.duration,
  }
}

/** Linha reta mínima se tudo falhar. */
function straightLineFallback(
  origin: { lat: number; lng: number },
  dest: { lat: number; lng: number },
): RouteResult {
  const km = haversineKm(origin, dest)
  return {
    path: [
      [origin.lat, origin.lng],
      [dest.lat, dest.lng],
    ],
    distanceM: km * 1000,
    durationS: Math.max(120, (km / 30) * 3600),
  }
}

export async function fetchDrivingRoute(
  origin: { lat: number; lng: number },
  dest: { lat: number; lng: number },
): Promise<RouteResult> {
  if (hasGoogleMapsKey()) {
    try {
      return await routeGoogle(origin, dest)
    } catch {
      /* OSRM */
    }
  }
  try {
    return await routeOsrm(origin, dest)
  } catch {
    return straightLineFallback(origin, dest)
  }
}
