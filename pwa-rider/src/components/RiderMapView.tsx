import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default marker icons
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

export interface RiderMapViewRef {
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

export const RiderMapView = forwardRef<RiderMapViewRef, RiderMapViewProps>((props, ref) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const userMarkerRef = useRef<L.Marker | null>(null)
  const accuracyCircleRef = useRef<L.Circle | null>(null)
  const markersMapRef = useRef<Map<string | number, L.Marker>>(new Map())
  const polylinesArrRef = useRef<L.Polyline[]>([])

  const containerStyle = {
    height: props.height || '100%',
    width: props.width || '100%',
    minHeight: '300px',
  }

  // Clear current polyline overlays
  const clearPolylines = () => {
    if (mapInstanceRef.current) {
      polylinesArrRef.current.forEach((polyline) => {
        mapInstanceRef.current?.removeLayer(polyline)
      })
    }
    polylinesArrRef.current = []
  }

  // Clear current marker overlays
  const clearMarkers = () => {
    if (mapInstanceRef.current) {
      markersMapRef.current.forEach((marker) => {
        mapInstanceRef.current?.removeLayer(marker)
      })
    }
    markersMapRef.current.clear()
  }

  // Add circle overlay
  const addCircle = (circleData: MapCircle) => {
    if (!mapInstanceRef.current) return

    if (accuracyCircleRef.current) {
      mapInstanceRef.current.removeLayer(accuracyCircleRef.current)
    }

    accuracyCircleRef.current = L.circle(circleData.center, {
      radius: circleData.radius,
      color: circleData.color || '#1E3A8A',
      fillColor: circleData.fillColor || '#1E3A8A',
      fillOpacity: 0.15,
      weight: 1,
    }).addTo(mapInstanceRef.current)
  }

  // Add single marker
  const addMarker = (markerData: MapMarker) => {
    if (!mapInstanceRef.current) return

    // Remove if exists
    if (markersMapRef.current.has(markerData.id)) {
      const existing = markersMapRef.current.get(markerData.id)
      if (existing) mapInstanceRef.current.removeLayer(existing)
    }

    const marker = L.marker(markerData.position, {
      icon: markerData.icon,
      draggable: markerData.draggable || props.draggableMarker || false,
    }).addTo(mapInstanceRef.current)

    if (markerData.popup) {
      marker.bindPopup(markerData.popup)
    }

    if (markerData.draggable || props.draggableMarker) {
      marker.on('dragend', (e: L.LeafletEvent) => {
        const target = e.target as L.Marker
        if (props.onMarkerDrag) {
          props.onMarkerDrag(markerData.id, [target.getLatLng().lat, target.getLatLng().lng])
        }
      })
    }

    markersMapRef.current.set(markerData.id, marker)
  }

  // Add single polyline
  const addPolyline = (polyData: MapPolyline) => {
    if (!mapInstanceRef.current) return

    const polyline = L.polyline(polyData.points, {
      color: polyData.color || '#1E3A8A',
      weight: polyData.weight || 4,
      opacity: 0.8,
      dashArray: polyData.dashed ? '10, 10' : undefined,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(mapInstanceRef.current)

    polylinesArrRef.current.push(polyline)
  }

  // Set Map view center
  const setCenter = (lat: number, lng: number, zoom?: number) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], zoom ?? mapInstanceRef.current.getZoom())
    }
  }

  // Fit bounds to all overlays
  const fitBounds = (padding: [number, number] = [50, 50]) => {
    if (!mapInstanceRef.current) return

    const layers: L.Layer[] = []
    markersMapRef.current.forEach((marker) => layers.push(marker))
    polylinesArrRef.current.forEach((polyline) => layers.push(polyline))
    if (accuracyCircleRef.current) layers.push(accuracyCircleRef.current)

    if (layers.length > 0) {
      const group = L.featureGroup(layers)
      mapInstanceRef.current.fitBounds(group.getBounds(), { padding })
    }
  }

  // Locate the user
  const locateUser = () => {
    if (!mapInstanceRef.current) return
    mapInstanceRef.current.locate({ setView: true, maxZoom: 17, enableHighAccuracy: true })
  }

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    map: mapInstanceRef.current,
    setCenter,
    fitBounds,
    locateUser,
    addMarker,
    removeMarker: (id) => {
      const marker = markersMapRef.current.get(id)
      if (marker && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(marker)
        markersMapRef.current.delete(id)
      }
    },
    clearMarkers,
    addPolyline,
    clearPolylines,
    addCircle,
  }))

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return

    const map = L.map(mapContainerRef.current, {
      center: props.center || [-23.5505, -46.6333],
      zoom: props.zoom || 15,
      zoomControl: true,
      attributionControl: true,
      preferCanvas: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    mapInstanceRef.current = map

    // Map click event
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (props.onMapClick) {
        props.onMapClick([e.latlng.lat, e.latlng.lng])
      }
    })

    // Geolocation events
    map.on('locationfound', (e: L.LocationEvent) => {
      const { lat, lng } = e.latlng
      const accuracy = e.accuracy

      if (props.onLocationFound) {
        props.onLocationFound([lat, lng], accuracy)
      }

      if (props.showUserLocation) {
        if (userMarkerRef.current) {
          userMarkerRef.current.setLatLng([lat, lng])
        } else {
          userMarkerRef.current = L.marker([lat, lng], {
            icon: L.divIcon({
              className: 'user-location-marker',
              html: '<div class="user-location-pulse"></div>',
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            }),
          }).addTo(map)
        }

        addCircle({ center: [lat, lng], radius: accuracy })
      }
    })

    map.on('locationerror', (e: L.LeafletEvent & { message: string }) => {
      if (props.onLocationError) {
        props.onLocationError(new Error(e.message))
      }
    })

    if (props.onMapReady) {
      props.onMapReady(map)
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Sync props updates
  useEffect(() => {
    if (!mapInstanceRef.current) return

    clearMarkers()
    if (props.markers) {
      props.markers.forEach(addMarker)
    }
  }, [props.markers])

  useEffect(() => {
    if (!mapInstanceRef.current) return

    clearPolylines()
    if (props.polyline) {
      props.polyline.forEach(addPolyline)
    }
  }, [props.polyline])

  useEffect(() => {
    if (!mapInstanceRef.current) return

    if (props.circle) {
      addCircle(props.circle)
    } else if (accuracyCircleRef.current) {
      mapInstanceRef.current.removeLayer(accuracyCircleRef.current)
      accuracyCircleRef.current = null
    }
  }, [props.circle])

  return (
    <div
      ref={mapContainerRef}
      className={`leaflet-map ${props.className || ''}`}
      style={containerStyle}
    />
  )
})

RiderMapView.displayName = 'RiderMapView'
export default RiderMapView
