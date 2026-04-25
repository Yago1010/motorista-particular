import { useEffect, useMemo } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

const defaultCenter: [number, number] = [-23.55052, -46.63331]

const pickupIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

const destIcon = L.divIcon({
  className: 'pwa-map-dest-pin',
  html: '<span></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
})

const driverIcon = L.divIcon({
  className: 'pwa-map-driver-pin',
  html: '<span aria-hidden="true">🚗</span>',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
})

type Geo = { lat: number; lng: number }

function MapViewSync({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom, { animate: true })
  }, [center, zoom, map])
  return null
}

function FitRoute({ path, a, b }: { path: [number, number][]; a: Geo; b: Geo }) {
  const map = useMap()
  useEffect(() => {
    let bounds = L.latLngBounds(L.latLng(a.lat, a.lng), L.latLng(b.lat, b.lng))
    for (const [lat, lng] of path) {
      bounds = bounds.extend(L.latLng(lat, lng))
    }
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15, animate: true })
  }, [path, a, b, map])
  return null
}

function FitPoints({ points }: { points: Geo[] }) {
  const map = useMap()
  useEffect(() => {
    const valid = points.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
    if (valid.length === 0) return
    let bounds = L.latLngBounds(L.latLng(valid[0].lat, valid[0].lng), L.latLng(valid[0].lat, valid[0].lng))
    for (const p of valid.slice(1)) {
      bounds = bounds.extend(L.latLng(p.lat, p.lng))
    }
    map.fitBounds(bounds, { padding: [56, 56], maxZoom: 16, animate: true })
  }, [points, map])
  return null
}

type RideMapProps = {
  origin: Geo | null
  dest: Geo | null
  className?: string
  /** Trajeto (lat, lng) — ex. rota Google/OSRM. */
  routePath?: [number, number][] | null
  /** Motorista a caminho (posição em tempo real). */
  driver?: Geo | null
}

export function RideMap({ origin, dest, className, routePath, driver }: RideMapProps) {
  const center = useMemo<[number, number]>(() => {
    if (origin) return [origin.lat, origin.lng]
    if (dest) return [dest.lat, dest.lng]
    if (driver) return [driver.lat, driver.lng]
    return defaultCenter
  }, [origin, dest, driver])

  const zoom = origin || dest || driver ? 16 : 12

  const fitExtras = useMemo(() => {
    const pts: Geo[] = []
    if (origin) pts.push(origin)
    if (dest) pts.push(dest)
    if (driver) pts.push(driver)
    return pts
  }, [origin, dest, driver])

  const showRoute = !!(origin && dest && routePath && routePath.length > 2)

  return (
    <div className={className ?? 'pwa-map-inner'}>
      <MapContainer center={center} zoom={zoom} scrollWheelZoom className="pwa-leaflet-map" zoomControl={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
        />
        {showRoute ? (
          <FitRoute path={routePath!} a={origin!} b={dest!} />
        ) : fitExtras.length >= 2 ? (
          <FitPoints points={fitExtras} />
        ) : (
          <MapViewSync center={center} zoom={zoom} />
        )}
        {routePath && routePath.length > 1 ? (
          <Polyline
            positions={routePath}
            pathOptions={{ color: '#2563eb', weight: 5, opacity: 0.88, lineCap: 'round', lineJoin: 'round' }}
          />
        ) : null}
        {origin ? <Marker position={[origin.lat, origin.lng]} icon={pickupIcon} /> : null}
        {dest ? <Marker position={[dest.lat, dest.lng]} icon={destIcon} /> : null}
        {driver ? <Marker position={[driver.lat, driver.lng]} icon={driverIcon} /> : null}
      </MapContainer>
    </div>
  )
}
