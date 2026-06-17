import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMapEvents } from 'react-leaflet'
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
  icon?: L.Icon
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

const UserLocationMarker = ({ position, accuracy }: { position: [number, number] | null; accuracy: number | null }) => {
  const map = useMapEvents({
    locationfound(e: any) {
      const { latitude, longitude } = e.latlng
      const accuracy = e.accuracy
    },
  })

  if (!position) return null

  return (
    <>
      <Marker
        position={position}
        icon={L.divIcon({
          className: 'user-location-marker',
          html: '<div class="user-location-pulse"></div>',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })}
      />
      {accuracy && (
        <Circle
          center={position}
          radius={accuracy}
          color="#1E3A8A"
          fillColor="#1E3A8A"
          fillOpacity={0.15}
          weight={1}
        />
      )}
    </>
  )
}

const TileLayerComponent = () => (
  <TileLayer
    attribution='&copy; OpenStreetMap contributors'
    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    maxZoom={19}
  />
)

export const DriverMapView = forwardRef<DriverMapViewRef, DriverMapViewProps>(
  (
    {
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
    },
    ref
  ) => {
    const mapRef = useRef<L.Map | null>(null)
    const mapContainerRef = useRef<HTMLDivElement>(null)
    const markerRefs = useRef<Map<string | number, L.Marker>>(new Map())
    const polylineRefs = useRef<L.Polyline[]>([])
    const userMarkerRef = useRef<L.Marker | null>(null)
    const accuracyCircleRef = useRef<L.Circle | null>(null)
    const [mapReady, setMapReady] = useState(false)
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
    const [userAccuracy, setUserAccuracy] = useState<number | null>(null)

    useImperativeHandle(ref, () => ({
      get map() {
        return mapRef.current
      },
      setCenter: (lat: number, lng: number, zoomLevel?: number) => {
        if (mapRef.current) {
          mapRef.current.setView([lat, lng], zoomLevel ?? mapRef.current.getZoom())
        }
      },
      fitBounds: (padding = [50, 50]) => {
        if (!mapRef.current) return
        const layers: L.Layer[] = []
        markerRefs.current.forEach((marker) => layers.push(marker))
        polylineRefs.current.forEach((poly) => layers.push(poly))
        if (accuracyCircleRef.current) layers.push(accuracyCircleRef.current)
        if (layers.length > 0) {
          const group = L.featureGroup(layers)
          mapRef.current.fitBounds(group.getBounds(), { padding })
        }
      },
      locateUser: () => {
        if (mapRef.current) {
          mapRef.current.locate({ setView: true, maxZoom: 17, enableHighAccuracy: true })
        }
      },
      addMarker: (markerData: MapMarker) => {
        if (!mapRef.current) return
        const marker = L.marker(markerData.position, {
          icon: markerData.icon,
          draggable: markerData.draggable || draggableMarker,
        }).addTo(mapRef.current)

        if (markerData.popup) {
          marker.bindPopup(markerData.popup)
        }

        if (markerData.draggable || draggableMarker) {
          marker.on('dragend', (e: L.LeafletEvent) => {
            const target = e.target as L.Marker
            onMarkerDrag?.(markerData.id, [target.getLatLng().lat, target.getLatLng().lng])
          })
        }

        markerRefs.current.set(markerData.id, marker)
      },
      removeMarker: (id: string | number) => {
        const marker = markerRefs.current.get(id)
        if (marker && mapRef.current) {
          mapRef.current.removeLayer(marker)
          markerRefs.current.delete(id)
        }
      },
      clearMarkers: () => {
        markerRefs.current.forEach((marker) => {
          if (mapRef.current) mapRef.current.removeLayer(marker)
        })
        markerRefs.current.clear()
      },
      addPolyline: (polyData: MapPolyline) => {
        if (!mapRef.current) return
        const polyLine = L.polyline(polyData.points, {
          color: polyData.color || '#1E3A8A',
          weight: polyData.weight || 4,
          opacity: 0.8,
          dashArray: polyData.dashed ? '10, 10' : undefined,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(mapRef.current)
        polylineRefs.current.push(polyLine)
      },
      clearPolylines: () => {
        polylineRefs.current.forEach((poly) => {
          if (mapRef.current) mapRef.current.removeLayer(poly)
        })
        polylineRefs.current.length = 0
      },
      addCircle: (circleData: MapCircle) => {
        if (!mapRef.current) return
        if (accuracyCircleRef.current) {
          mapRef.current.removeLayer(accuracyCircleRef.current)
        }
        accuracyCircleRef.current = L.circle(circleData.center, {
          radius: circleData.radius,
          color: circleData.color || '#1E3A8A',
          fillColor: circleData.fillColor || '#1E3A8A',
          fillOpacity: 0.15,
          weight: 1,
        }).addTo(mapRef.current)
      },
    }))

    useEffect(() => {
      if (!mapContainerRef.current || mapRef.current) return

      mapRef.current = L.map(mapContainerRef.current, {
        center,
        zoom,
        zoomControl: true,
        attributionControl: true,
        preferCanvas: true,
      })

      mapRef.current.on('click', (e: L.LeafletMouseEvent) => {
        onMapClick?.([e.latlng.lat, e.latlng.lng])
      })

      if (onMapReady) {
        onMapReady(mapRef.current)
      }

      setMapReady(true)

      return () => {
        if (mapRef.current) {
          mapRef.current.off()
          mapRef.current.remove()
          mapRef.current = null
        }
        markerRefs.current.clear()
        polylineRefs.current.length = 0
        userMarkerRef.current = null
        accuracyCircleRef.current = null
      }
    }, [])

    useEffect(() => {
      if (!mapRef.current || !mapReady) return
      markers.forEach((marker) => {
        const ref = mapRef.current!
        const existingMarker = markerRefs.current.get(marker.id)
        if (existingMarker) {
          existingMarker.setLatLng(marker.position)
          if (marker.popup) {
            existingMarker.setPopupContent(marker.popup)
          }
        } else {
          const newMarker = L.marker(marker.position, {
            icon: marker.icon,
            draggable: marker.draggable || draggableMarker,
          }).addTo(ref)

          if (marker.popup) {
            newMarker.bindPopup(marker.popup)
          }

          if (marker.draggable || draggableMarker) {
            newMarker.on('dragend', (e: L.LeafletEvent) => {
              const target = e.target as L.Marker
              onMarkerDrag?.(marker.id, [target.getLatLng().lat, target.getLatLng().lng])
            })
          }

          markerRefs.current.set(marker.id, newMarker)
        }
      })
    }, [markers, draggableMarker, onMarkerDrag, mapReady])

    useEffect(() => {
      if (!mapRef.current || !mapReady) return
      polylineRefs.current.forEach((poly) => {
        if (mapRef.current) mapRef.current.removeLayer(poly)
      })
      polylineRefs.current.length = 0

      polyline.forEach((polyData) => {
        const newPoly = L.polyline(polyData.points, {
          color: polyData.color || '#1E3A8A',
          weight: polyData.weight || 4,
          opacity: 0.8,
          dashArray: polyData.dashed ? '10, 10' : undefined,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(mapRef.current!)
        polylineRefs.current.push(newPoly)
      })
    }, [polyline, mapReady])

    useEffect(() => {
      if (!mapRef.current || !mapReady || !circle) return
      if (accuracyCircleRef.current) {
        mapRef.current.removeLayer(accuracyCircleRef.current)
      }
      accuracyCircleRef.current = L.circle(circle.center, {
        radius: circle.radius,
        color: circle.color || '#1E3A8A',
        fillColor: circle.fillColor || '#1E3A8A',
        fillOpacity: 0.15,
        weight: 1,
      }).addTo(mapRef.current)
    }, [circle, mapReady])

    useEffect(() => {
      if (!mapRef.current || !mapReady || !center) return
      mapRef.current.setView(center, mapRef.current.getZoom())
    }, [center, mapReady])

    const handleLocationFound = (e: any) => {
      const { latitude, longitude } = e.latlng
      const accuracy = e.accuracy
      setUserLocation([latitude, longitude])
      setUserAccuracy(accuracy)
      onLocationFound?.([latitude, longitude], accuracy)
    }

    const handleLocationError = (e: any) => {
      onLocationError?.(new Error(e.message))
    }

    return (
      <div
        ref={mapContainerRef}
        className={clsx('leaflet-map', className)}
        style={{
          height,
          width,
          minHeight: '300px',
          zIndex: 1,
        }}
      >
        {mapReady && (
          <MapContainer
            center={center}
            zoom={zoom}
            scrollWheelZoom={true}
            zoomControl={false}
            attributionControl={false}
            style={{ height: '100%', width: '100%' }}
            whenReady={() => {
              if (mapRef.current) {
                mapRef.current.on('locationfound', handleLocationFound)
                mapRef.current.on('locationerror', handleLocationError)
              }
            }}
          >
            <TileLayerComponent />
            {markers.map((marker) => (
              <Marker
                key={marker.id}
                position={marker.position}
                icon={marker.icon}
                draggable={marker.draggable || draggableMarker}
              >
                {marker.popup && <Popup>{marker.popup}</Popup>}
              </Marker>
            ))}
            {polyline.map((poly, index) => (
              <Polyline
                key={index}
                positions={poly.points}
                color={poly.color || '#1E3A8A'}
                weight={poly.weight || 4}
                opacity={0.8}
                dashArray={poly.dashed ? '10, 10' : undefined}
                lineCap="round"
                lineJoin="round"
              />
            ))}
            {circle && (
              <Circle
                center={circle.center}
                radius={circle.radius}
                color={circle.color || '#1E3A8A'}
                fillColor={circle.fillColor || '#1E3A8A'}
                fillOpacity={0.15}
                weight={1}
              />
            )}
            {showUserLocation && (
              <UserLocationMarker position={userLocation} accuracy={userAccuracy} />
            )}
          </MapContainer>
        )}
      </div>
    )
  }
)

DriverMapView.displayName = 'DriverMapView'

export default DriverMapView