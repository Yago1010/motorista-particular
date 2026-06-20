import { useEffect, useImperativeHandle, forwardRef, useCallback, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, Circle, Popup, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { clsx } from 'clsx'

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
  className?: string
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

export interface DriverMapViewProps {
  center?: [number, number]
  zoom?: number
  height?: string
  width?: string
  draggableMarker?: boolean
  showUserLocation?: boolean
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

export interface DriverMapViewRef {
  map: L.Map | null
  setCenter: (lat: number, lng: number, zoom?: number) => void
  fitBounds: (padding?: [number, number]) => void
  locateUser: () => void
  addMarker: (marker: MapMarker) => void
  removeMarker: (id: string | number) => void
  clearMarkers: () => void
  addPolyline: (polyline: MapPolyline) => void
  clearPolylines: () => void
  addCircle: (circle: MapCircle) => void
}

function MapController({
  center,
  markers,
  polylines,
  autoFit,
  fitPadding,
  onMapReady,
}: {
  center?: [number, number]
  markers: MapMarker[]
  polylines: MapPolyline[]
  autoFit?: boolean
  fitPadding?: [number, number]
  onMapReady?: (map: L.Map) => void
}) {
  const map = useMap()

  useEffect(() => {
    onMapReady?.(map)
  }, [map, onMapReady])

  useEffect(() => {
    if (!center) return
    try {
      map.setView(center, map.getZoom())
    } catch {
      /* map may be tearing down */
    }
  }, [center?.[0], center?.[1], map])

  useEffect(() => {
    if (!autoFit) return
    const points: L.LatLngExpression[] = []
    markers.forEach((m) => points.push(m.position))
    polylines.forEach((p) => p.points.forEach((pt) => points.push(pt)))
    if (points.length === 0) return
    try {
      map.fitBounds(L.latLngBounds(points), { padding: fitPadding || [50, 50] })
    } catch {
      /* ignore invalid bounds during unmount */
    }
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

  useMapEvents({
    locationfound(e) {
      const p: [number, number] = [e.latlng.lat, e.latlng.lng]
      onLocationFound?.(p, e.accuracy)
    },
    locationerror(e) {
      onLocationError?.(new Error(e.message))
    },
  })

  useEffect(() => {
    if (enabled) map.locate({ watch: true, enableHighAccuracy: true, maxZoom: 17 })
  }, [enabled, map])

  return null
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

export const DriverMapView = forwardRef<DriverMapViewRef, DriverMapViewProps>((props, ref) => {
  const {
    center = [-23.5505, -46.6333],
    zoom = 15,
    height = '100%',
    width = '100%',
    draggableMarker = false,
    showUserLocation = false,
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
  const dynamicMarkersRef = useRef<Map<string | number, L.Marker>>(new Map())
  const dynamicPolylinesRef = useRef<L.Polyline[]>([])
  const dynamicCircleRef = useRef<L.Circle | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 80)
    return () => {
      window.clearTimeout(timer)
      setMounted(false)
      internalMapRef.current = null
    }
  }, [])

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
    addMarker(markerData: MapMarker) {
      const m = internalMapRef.current
      if (!m) return
      const marker = L.marker(markerData.position, {
        icon: markerData.icon,
        draggable: markerData.draggable || draggableMarker,
      }).addTo(m)
      if (markerData.popup) marker.bindPopup(markerData.popup)
      dynamicMarkersRef.current.set(markerData.id, marker)
    },
    removeMarker(id: string | number) {
      const m = internalMapRef.current
      const marker = dynamicMarkersRef.current.get(id)
      if (m && marker) {
        m.removeLayer(marker)
        dynamicMarkersRef.current.delete(id)
      }
    },
    clearMarkers() {
      const m = internalMapRef.current
      dynamicMarkersRef.current.forEach((marker) => {
        if (m) m.removeLayer(marker)
      })
      dynamicMarkersRef.current.clear()
    },
    addPolyline(polyData: MapPolyline) {
      const m = internalMapRef.current
      if (!m) return
      const line = L.polyline(polyData.points, {
        color: polyData.color || '#169648',
        weight: polyData.weight || 4,
        opacity: 0.85,
        dashArray: polyData.dashed ? '10, 10' : undefined,
      }).addTo(m)
      dynamicPolylinesRef.current.push(line)
    },
    clearPolylines() {
      const m = internalMapRef.current
      dynamicPolylinesRef.current.forEach((line) => {
        if (m) m.removeLayer(line)
      })
      dynamicPolylinesRef.current.length = 0
    },
    addCircle(circleData: MapCircle) {
      const m = internalMapRef.current
      if (!m) return
      if (dynamicCircleRef.current) m.removeLayer(dynamicCircleRef.current)
      dynamicCircleRef.current = L.circle(circleData.center, {
        radius: circleData.radius,
        color: circleData.color || '#169648',
        fillColor: circleData.fillColor || '#169648',
        fillOpacity: 0.12,
        weight: 1,
      }).addTo(m)
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
      {!mounted ? (
        <div className="map-loading-placeholder" style={{ height: '100%', width: '100%' }} />
      ) : (
      <MapContainer center={center} zoom={zoom} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <ClickHandler />
        <MapController
          center={center}
          markers={markers}
          polylines={polyline}
          autoFit={autoFit}
          fitPadding={fitPadding}
          onMapReady={handleMapReady}
        />
        {markers.map((marker) =>
          marker.draggable || draggableMarker ? (
            <DraggableMarker
              key={marker.id}
              marker={marker}
              draggableMarker={draggableMarker}
              onMarkerDrag={onMarkerDrag}
            />
          ) : (
            <Marker key={marker.id} position={marker.position} icon={marker.icon ?? L.icon({ iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png', iconSize: [25, 41], iconAnchor: [12, 41] })}>
              {marker.popup ? <Popup>{marker.popup}</Popup> : null}
            </Marker>
          )
        )}
        {polyline.map((poly) => (
          <Polyline
            key={`${poly.points.length}-${poly.points[0]?.[0]}-${poly.points[0]?.[1]}`}
            positions={poly.points}
            color={poly.color || '#169648'}
            weight={poly.weight || 4}
            opacity={0.85}
            dashArray={poly.dashed ? '10, 10' : undefined}
          />
        ))}
        {circle && (
          <Circle
            center={circle.center}
            radius={circle.radius}
            color={circle.color || '#169648'}
            fillColor={circle.fillColor || '#169648'}
            fillOpacity={0.12}
            weight={1}
          />
        )}
        {showUserLocation && (
          <LocationWatcher enabled onLocationFound={onLocationFound} onLocationError={onLocationError} />
        )}
      </MapContainer>
      )}
    </div>
  )
})

DriverMapView.displayName = 'DriverMapView'

export default DriverMapView
