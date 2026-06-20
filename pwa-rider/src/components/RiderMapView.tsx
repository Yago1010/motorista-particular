import { useEffect, useImperativeHandle, forwardRef, useCallback, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, Circle, Popup, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { clsx } from 'clsx'
import AnimatedMarker from './AnimatedMarker'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export interface MapMarker {
  id: string | number
  position: [number, number]
  icon?: L.Icon | L.DivIcon
  popup?: string
  draggable?: boolean
  animated?: boolean
}

export interface MapPolyline {
  points: [number, number][]
  color?: string
  weight?: number
  dashed?: boolean
}

export interface MapCircle {
  center: [number, number]
  radius: number
  color?: string
  fillColor?: string
}

export interface RiderMapViewProps {
  center?: [number, number]
  zoom?: number
  height?: string
  width?: string
  draggableMarker?: boolean
  showUserLocation?: boolean
  showZoomControl?: boolean
  zoomControlPosition?: 'topleft' | 'topright' | 'bottomleft' | 'bottomright'
  markers?: MapMarker[]
  polyline?: MapPolyline[]
  circle?: MapCircle
  onMapReady?: (map: L.Map) => void
  onMarkerDrag?: (id: string | number, position: [number, number]) => void
  onMapClick?: (position: [number, number]) => void
  onLocationFound?: (position: [number, number], accuracy: number) => void
  onLocationError?: (error: Error) => void
  className?: string
  fitPadding?: [number, number]
  autoFit?: boolean
}

export interface RiderMapViewRef {
  map: L.Map | null
  setCenter: (lat: number, lng: number, zoom?: number) => void
  fitBounds: (padding?: [number, number]) => void
  locateUser: () => void
  zoomIn: () => void
  zoomOut: () => void
}

function MapController({
  center,
  markers,
  polylines,
  autoFit,
  fitPadding,
  onMapReady,
  showZoomControl,
  zoomControlPosition,
}: {
  center?: [number, number]
  markers: MapMarker[]
  polylines: MapPolyline[]
  autoFit?: boolean
  fitPadding?: [number, number]
  onMapReady?: (map: L.Map) => void
  showZoomControl?: boolean
  zoomControlPosition?: 'topleft' | 'topright' | 'bottomleft' | 'bottomright'
}) {
  const map = useMap()

  useEffect(() => {
    onMapReady?.(map)
  }, [map, onMapReady])

  useEffect(() => {
    if (!showZoomControl) return
    const control = L.control.zoom({ position: zoomControlPosition || 'bottomright' })
    control.addTo(map)
    return () => {
      control.remove()
    }
  }, [map, showZoomControl, zoomControlPosition])

  useEffect(() => {
    if (center) map.setView(center, map.getZoom())
  }, [center?.[0], center?.[1], map])

  useEffect(() => {
    if (!autoFit) return
    const points: L.LatLngExpression[] = []
    markers.forEach((m) => points.push(m.position))
    polylines.forEach((p) => p.points.forEach((pt) => points.push(pt)))
    if (points.length === 0) return
    map.fitBounds(L.latLngBounds(points), { padding: fitPadding || [50, 50] })
  }, [markers, polylines, autoFit, map, fitPadding])

  return null
}

function LocationWatcher({
  enabled,
  onLocationFound,
  onLocationError,
}: {
  enabled?: boolean
  onLocationFound?: (pos: [number, number], accuracy: number) => void
  onLocationError?: (error: Error) => void
}) {
  const map = useMap()
  const [pos, setPos] = useState<[number, number] | null>(null)
  const [accuracy, setAccuracy] = useState<number | null>(null)

  useMapEvents({
    locationfound(e) {
      const p: [number, number] = [e.latlng.lat, e.latlng.lng]
      setPos(p)
      setAccuracy(e.accuracy)
      onLocationFound?.(p, e.accuracy)
    },
    locationerror(e) {
      onLocationError?.(new Error(e.message))
    },
  })

  useEffect(() => {
    if (enabled) map.locate({ watch: true, enableHighAccuracy: true, maxZoom: 17 })
  }, [enabled, map])

  if (!pos) return null
  return (
    <>
      <Marker
        position={pos}
        icon={L.divIcon({
          className: 'user-location-marker',
          html: '<div class="user-location-pulse"></div>',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })}
      />
      {accuracy && (
        <Circle center={pos} radius={accuracy} color="#39ff6a" fillColor="#39ff6a" fillOpacity={0.12} weight={1} />
      )}
    </>
  )
}

function DraggableMarker({
  marker,
  draggableMarker,
  onMarkerDrag,
}: {
  marker: MapMarker
  draggableMarker?: boolean
  onMarkerDrag?: (id: string | number, position: [number, number]) => void
}) {
  const eventHandlers = {
    dragend(e: L.LeafletEvent) {
      const target = e.target as L.Marker
      onMarkerDrag?.(marker.id, [target.getLatLng().lat, target.getLatLng().lng])
    },
  }
  return (
    <Marker
      position={marker.position}
      icon={marker.icon}
      draggable={marker.draggable || draggableMarker}
      eventHandlers={eventHandlers}
    >
      {marker.popup ? <Popup>{marker.popup}</Popup> : null}
    </Marker>
  )
}

export const RiderMapView = forwardRef<RiderMapViewRef, RiderMapViewProps>((props, ref) => {
  const {
    center = [-23.5505, -46.6333],
    zoom = 15,
    height = '100%',
    width = '100%',
    draggableMarker = false,
    showUserLocation = false,
    showZoomControl = false,
    zoomControlPosition = 'bottomright',
    markers = [],
    polyline = [],
    circle,
    onMapReady,
    onMarkerDrag,
    onMapClick,
    onLocationFound,
    onLocationError,
    className = '',
    fitPadding,
    autoFit = false,
  } = props

  const internalMapRef = useRef<L.Map | null>(null)

  const handleMapReady = useCallback(
    (map: L.Map) => {
      internalMapRef.current = map
      onMapReady?.(map)
    },
    [onMapReady]
  )

  useImperativeHandle(ref, () => ({
    get map() {
      return internalMapRef.current
    },
    setCenter(lat: number, lng: number, z?: number) {
      const m = internalMapRef.current
      if (m) m.setView([lat, lng], z ?? m.getZoom())
    },
    fitBounds(padding: [number, number] = [50, 50]) {
      const m = internalMapRef.current
      if (!m) return
      const points: L.LatLngExpression[] = []
      markers.forEach((mk) => points.push(mk.position))
      polyline.forEach((p) => p.points.forEach((pt) => points.push(pt)))
      if (points.length) m.fitBounds(L.latLngBounds(points), { padding })
    },
    locateUser() {
      internalMapRef.current?.locate({ setView: true, maxZoom: 17, enableHighAccuracy: true })
    },
    zoomIn() {
      internalMapRef.current?.zoomIn()
    },
    zoomOut() {
      internalMapRef.current?.zoomOut()
    },
  }))

  const ClickHandler = () => {
    useMapEvents({
      click(e) {
        onMapClick?.([e.latlng.lat, e.latlng.lng])
      },
    })
    return null
  }

  return (
    <div className={clsx('leaflet-map', className)} style={{ height, width, minHeight: '300px', zIndex: 1 }}>
      <MapContainer center={center} zoom={zoom} scrollWheelZoom zoomControl={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} />
        <ClickHandler />
        <MapController
          center={center}
          markers={markers}
          polylines={polyline}
          autoFit={autoFit}
          fitPadding={fitPadding}
          onMapReady={handleMapReady}
          showZoomControl={showZoomControl}
          zoomControlPosition={zoomControlPosition}
        />
        {markers.map((marker) =>
          marker.animated ? (
            <AnimatedMarker key={marker.id} position={marker.position} icon={marker.icon as L.DivIcon} popup={marker.popup} />
          ) : marker.draggable || draggableMarker ? (
            <DraggableMarker key={marker.id} marker={marker} draggableMarker={draggableMarker} onMarkerDrag={onMarkerDrag} />
          ) : (
            <Marker key={marker.id} position={marker.position} icon={marker.icon}>
              {marker.popup ? <Popup>{marker.popup}</Popup> : null}
            </Marker>
          )
        )}
        {polyline.map((poly, i) => (
          <Polyline
            key={i}
            positions={poly.points}
            color={poly.color || '#39ff6a'}
            weight={poly.weight || 4}
            opacity={0.85}
            dashArray={poly.dashed ? '10, 10' : undefined}
          />
        ))}
        {circle && (
          <Circle
            center={circle.center}
            radius={circle.radius}
            color={circle.color || '#39ff6a'}
            fillColor={circle.fillColor || '#39ff6a'}
            fillOpacity={0.12}
            weight={1}
          />
        )}
        {showUserLocation && (
          <LocationWatcher enabled onLocationFound={onLocationFound} onLocationError={onLocationError} />
        )}
      </MapContainer>
    </div>
  )
})

RiderMapView.displayName = 'RiderMapView'
export default RiderMapView
