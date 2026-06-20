import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import { useRidesStore, type Ride } from '@/stores/rides'
import {
  useRideQuery,
  useDriverLocationQuery,
} from '@/hooks/queries/useRideQueries'
import { fetchOsrmRoute, formatDistance, formatDuration } from '@/utils/navigation'
import { sliceRouteRemaining, sliceRouteTraveled } from '@/utils/rideSimulation'
import { isDemoModeEnabled, useDemoRideSimulation } from '@/hooks/useDemoRideSimulation'
import { isDemoRideId } from '@/utils/demoRideBridge'
import { useAuthStore } from '@/stores/auth'

function driverMarkerIcon() {
  return L.divIcon({
    className: 'driver-car-marker',
    html: `<div style="background:#39ff6a;color:#031105;width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;border:3px solid white;box-shadow:0 3px 12px rgba(0,0,0,0.4)">🚗</div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  })
}

/** Polling + mapa do motorista enquanto corrida ativa na Home. */
export function useHomeRideTracking(rideId: string | number | null | undefined) {
  const authStore = useAuthStore()
  const ridesStore = useRidesStore()
  const enabled = rideId != null && rideId !== ''

  const { data: ride, isLoading } = useRideQuery(rideId ?? undefined, enabled)
  const demoEnabled = isDemoModeEnabled(authStore.token) || isDemoRideId(rideId ?? undefined)
  const demoSim = useDemoRideSimulation(ride, demoEnabled && enabled)
  const displayRide = (demoSim.ride ?? ride) as Ride | null | undefined

  const hasDriver =
    !!displayRide?.driver && !['searching', 'cancelled'].includes(displayRide?.status || '')

  const useLiveDriverApi = hasDriver && enabled && !demoSim.driverLocation
  const { data: driverLoc } = useDriverLocationQuery(rideId ?? undefined, useLiveDriverApi)

  const [tripRoute, setTripRoute] = useState<[number, number][]>([])
  const [approachRouteFull, setApproachRouteFull] = useState<[number, number][]>([])
  const [remainingRoute, setRemainingRoute] = useState<[number, number][]>([])
  const [traveledRoute, setTraveledRoute] = useState<[number, number][]>([])
  const [osrmEta, setOsrmEta] = useState<{ distance: number; duration: number } | null>(null)
  const approachFetchedRef = useRef(false)

  useEffect(() => {
    if (displayRide) ridesStore.setCurrentRide(displayRide)
  }, [displayRide])

  useEffect(() => {
    if (demoSim.driverLocation) {
      ridesStore.setDriverLocation(demoSim.driverLocation.lat, demoSim.driverLocation.lng)
    } else if (driverLoc) {
      ridesStore.setDriverLocation(driverLoc.lat, driverLoc.lng)
    } else if (displayRide?.driver?.latitude != null && displayRide?.driver?.longitude != null) {
      ridesStore.setDriverLocation(displayRide.driver.latitude, displayRide.driver.longitude)
    } else if ((displayRide as Ride & { driver_lat?: number })?.driver_lat != null) {
      const r = displayRide as Ride & { driver_lat?: number; driver_lng?: number }
      ridesStore.setDriverLocation(r.driver_lat!, r.driver_lng!)
    }
  }, [driverLoc, displayRide, demoSim.driverLocation])

  const driverLocation = demoSim.driverLocation || driverLoc || ridesStore.driverLocation
  const isSearching = displayRide?.status === 'searching'
  const isAtPickup = displayRide?.status === 'pickup_arrived'
  const isEnRoute = ['accepted', 'arrived'].includes(displayRide?.status || '')
  const isInProgress = ['started', 'in_progress'].includes(displayRide?.status || '')
  const isPaid = !!displayRide?.is_paid
  const isCompleted = displayRide?.status === 'completed'

  const mapDriverLocation =
    isAtPickup && displayRide?.origin_lat != null && displayRide?.origin_lng != null
      ? { lat: displayRide.origin_lat, lng: displayRide.origin_lng }
      : driverLocation

  useEffect(() => {
    approachFetchedRef.current = false
    setApproachRouteFull([])
  }, [displayRide?.id])

  useEffect(() => {
    const r = displayRide
    if (!r?.origin_lat || !r?.origin_lng || !r?.dest_lat || !r?.dest_lng) return
    fetchOsrmRoute(r.origin_lat, r.origin_lng, r.dest_lat, r.dest_lng).then((result) => {
      if (result) setTripRoute(result.points)
    })
  }, [displayRide?.id, displayRide?.origin_lat, displayRide?.dest_lat])

  useEffect(() => {
    const r = displayRide
    if (!r?.origin_lat || !r?.origin_lng || !driverLocation || !isEnRoute) return
    if (approachFetchedRef.current && approachRouteFull.length) return

    const startLat = driverLocation.lat
    const startLng = driverLocation.lng
    fetchOsrmRoute(startLat, startLng, r.origin_lat, r.origin_lng).then((result) => {
      if (result?.points?.length) {
        approachFetchedRef.current = true
        setApproachRouteFull(result.points)
      }
    })
  }, [displayRide?.id, displayRide?.origin_lat, isEnRoute, driverLocation?.lat, approachRouteFull.length])

  useEffect(() => {
    const r = displayRide
    if (!r?.origin_lat || !r?.origin_lng || !mapDriverLocation || (!isEnRoute && !isInProgress && !isAtPickup)) return
    if (isAtPickup) {
      setTraveledRoute([])
      setRemainingRoute([])
      setOsrmEta(null)
      return
    }

    const destLat = isInProgress ? (r.dest_lat ?? r.origin_lat) : r.origin_lat
    const destLng = isInProgress ? (r.dest_lng ?? r.origin_lng) : r.origin_lng
    if (destLat == null || destLng == null) return

    const activeFullRoute = isInProgress ? tripRoute : approachRouteFull

    if (activeFullRoute.length) {
      setTraveledRoute(sliceRouteTraveled(activeFullRoute, mapDriverLocation.lat, mapDriverLocation.lng))
      setRemainingRoute(sliceRouteRemaining(activeFullRoute, mapDriverLocation.lat, mapDriverLocation.lng))
    }

    fetchOsrmRoute(mapDriverLocation.lat, mapDriverLocation.lng, destLat, destLng).then((result) => {
      if (result) {
        if (!activeFullRoute.length) setRemainingRoute(result.points)
        setOsrmEta({ distance: result.distance, duration: result.duration })
      }
    })
  }, [
    mapDriverLocation?.lat,
    mapDriverLocation?.lng,
    isEnRoute,
    isInProgress,
    isAtPickup,
    displayRide?.origin_lat,
    displayRide?.dest_lat,
    tripRoute,
    approachRouteFull,
  ])

  const eta = useMemo(() => {
    if (driverLoc?.time && driverLoc?.distance) {
      const distM =
        typeof driverLoc.distance === 'string'
          ? parseFloat(driverLoc.distance) * 1000
          : Number(driverLoc.distance)
      return { distance: distM || osrmEta?.distance || 0, duration: (driverLoc.time || 0) * 60 }
    }
    return osrmEta
  }, [driverLoc, osrmEta])

  const trackingMarkers = useMemo(() => {
    const markers = []
    if (mapDriverLocation && displayRide?.driver) {
      markers.push({
        id: 'driver',
        position: [mapDriverLocation.lat, mapDriverLocation.lng] as [number, number],
        popup: `${displayRide.driver.first_name} • ${displayRide.driver.vehicle_model || 'Veículo'}`,
        icon: driverMarkerIcon(),
        animated: !isAtPickup,
      })
    }
    return markers
  }, [displayRide, mapDriverLocation, isAtPickup])

  const trackingPolylines = useMemo(() => {
    const lines: Array<{ points: [number, number][]; color: string; weight: number; dashed?: boolean }> = []

    if (tripRoute.length && (isInProgress || isEnRoute)) {
      lines.push({
        points: tripRoute,
        color: '#475569',
        weight: 4,
        dashed: true,
      })
    }

    if (traveledRoute.length >= 2 && (isEnRoute || isInProgress)) {
      lines.push({
        points: traveledRoute,
        color: '#166534',
        weight: 5,
        dashed: false,
      })
    }

    if (remainingRoute.length >= 2 && (isEnRoute || isInProgress)) {
      lines.push({
        points: remainingRoute,
        color: '#39ff6a',
        weight: 6,
        dashed: false,
      })
    }

    return lines
  }, [tripRoute, traveledRoute, remainingRoute, isEnRoute, isInProgress])

  const etaLabel =
    eta && displayRide?.driver && (isEnRoute || isInProgress || isAtPickup)
      ? isAtPickup
        ? 'Motorista no ponto de embarque'
        : `${isInProgress ? 'Destino em' : 'Chega em'} ${formatDuration(eta.duration)} • ${formatDistance(eta.distance)}`
      : null

  return {
    displayRide,
    isLoading: isLoading && !displayRide,
    isSearching,
    isEnRoute,
    isInProgress,
    isAtPickup,
    isPaid,
    isCompleted,
    driverLocation,
    mapDriverLocation,
    trackingMarkers,
    trackingPolylines,
    etaLabel,
    demoEnabled,
  }
}
