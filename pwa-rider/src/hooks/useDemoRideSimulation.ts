import { useEffect, useRef, useState } from 'react'
import type { Ride } from '@/stores/rides'
import { interpolateAlongRoute, progressOnRoute, timedProgress } from '@/utils/rideSimulation'
import { fetchOsrmRoute } from '@/utils/navigation'
import { getDemoRide, updateDemoRide } from '@/utils/demoRideBridge'

type SimPhase =
  | 'idle'
  | 'searching'
  | 'accepted'
  | 'pickup_arrived'
  | 'in_progress'
  | 'destination_arrived'
  | 'completed'

interface SimState {
  ride: Ride | null
  driverLocation: { lat: number; lng: number } | null
  phase: SimPhase
}

const DEFAULT_DRIVER = {
  first_name: 'João',
  last_name: 'Silva',
  phone: '11999990000',
  vehicle_model: 'Corolla',
  vehicle_plate: 'ABC1D23',
  rating: 4.9,
}

function offsetStart(originLat: number, originLng: number) {
  return { lat: originLat - 0.008, lng: originLng - 0.006 }
}

/** Simula motorista no mapa (passageiro solo) ou reflete corrida demo controlada pelo app motorista. */
export function useDemoRideSimulation(
  ride: Ride | null | undefined,
  enabled: boolean
): SimState {
  const [sim, setSim] = useState<SimState>({ ride: null, driverLocation: null, phase: 'idle' })
  const startedRef = useRef<number | null>(null)
  const approachRef = useRef<[number, number][]>([])
  const tripRef = useRef<[number, number][]>([])
  const reflectApproachRef = useRef<[number, number][]>([])
  const reflectTripRef = useRef<[number, number][]>([])
  const phaseStartedRef = useRef<number>(Date.now())
  const lastStatusRef = useRef<string>('')

  useEffect(() => {
    if (!enabled || !ride?.origin_lat || !ride?.origin_lng) {
      setSim({ ride: null, driverLocation: null, phase: 'idle' })
      return
    }

    if (ride.status === 'cancelled') {
      setSim({ ride: null, driverLocation: null, phase: 'idle' })
      return
    }

    const demo = getDemoRide()
    const isSameDemo = demo && String(demo.id) === String(ride.id)
    const useReflect = isSameDemo && demo!.status !== 'searching'

    const originLat = ride.origin_lat
    const originLng = ride.origin_lng
    const destLat = ride.dest_lat ?? originLat + 0.02
    const destLng = ride.dest_lng ?? originLng + 0.02

    if (useReflect) {
      const ensureRoutes = async (d: NonNullable<ReturnType<typeof getDemoRide>>) => {
        if (['accepted', 'arrived', 'pickup_arrived'].includes(d.status || '') && !reflectApproachRef.current.length) {
          const start = d.driver_lat != null ? { lat: d.driver_lat, lng: d.driver_lng! } : offsetStart(originLat, originLng)
          const route = await fetchOsrmRoute(start.lat, start.lng, originLat, originLng)
          reflectApproachRef.current =
            route?.points?.length ? route.points : [
              [start.lat, start.lng],
              [originLat, originLng],
            ]
        }
        if (['in_progress', 'started', 'destination_arrived', 'completed'].includes(d.status || '') && !reflectTripRef.current.length) {
          const route = await fetchOsrmRoute(originLat, originLng, destLat, destLng)
          reflectTripRef.current =
            route?.points?.length ? route.points : [
              [originLat, originLng],
              [destLat, destLng],
            ]
        }
      }

      const reflect = () => {
        const d = getDemoRide()
        if (!d || String(d.id) !== String(ride.id)) return

        if (d.status !== lastStatusRef.current) {
          lastStatusRef.current = d.status || ''
          phaseStartedRef.current = Date.now()
          if (d.status === 'in_progress' || d.status === 'started') {
            reflectTripRef.current = []
          }
          if (d.status === 'accepted') {
            reflectApproachRef.current = []
          }
        }

        void ensureRoutes(d)

        const driver = d.driver || ride.driver
        let loc: { lat: number; lng: number } | null = null
        const elapsed = Date.now() - phaseStartedRef.current

        if (['accepted', 'arrived'].includes(d.status || '')) {
          const route = reflectApproachRef.current
          if (route.length) {
            const autoT = timedProgress(phaseStartedRef.current, 50000)
            const autoLoc = interpolateAlongRoute(route, autoT)
            if (d.driver_lat != null && d.driver_lng != null) {
              const gpsT = progressOnRoute(route, d.driver_lat, d.driver_lng)
              const t = Math.max(autoT, gpsT)
              loc = interpolateAlongRoute(route, t) || autoLoc
            } else {
              loc = autoLoc
            }
          } else {
            loc = offsetStart(originLat, originLng)
          }
          updateDemoRide({ driver_lat: loc?.lat, driver_lng: loc?.lng })
        } else if (['pickup_arrived'].includes(d.status || '')) {
          loc = { lat: originLat, lng: originLng }
          updateDemoRide({ driver_lat: originLat, driver_lng: originLng })
        } else if (['in_progress', 'started'].includes(d.status || '')) {
          const route = reflectTripRef.current
          if (route.length) {
            const autoT = timedProgress(phaseStartedRef.current, 70000)
            const autoLoc = interpolateAlongRoute(route, autoT)
            if (d.driver_lat != null && d.driver_lng != null) {
              const gpsT = progressOnRoute(route, d.driver_lat, d.driver_lng)
              const t = Math.max(autoT, gpsT)
              loc = interpolateAlongRoute(route, t) || autoLoc
            } else {
              loc = autoLoc
            }
          } else {
            loc = { lat: originLat, lng: originLng }
          }
          updateDemoRide({ driver_lat: loc?.lat, driver_lng: loc?.lng })
        } else if (['destination_arrived', 'completed'].includes(d.status || '')) {
          loc = { lat: destLat, lng: destLng }
        }

        const merged: Ride = {
          ...ride,
          ...d,
          status: d.status || ride.status,
          driver,
          is_paid: d.is_paid,
        }
        setSim({
          ride: merged,
          driverLocation: loc,
          phase: (d.status as SimPhase) || 'accepted',
        })
      }

      reflect()
      const timer = setInterval(reflect, 500)
      return () => clearInterval(timer)
    }

    if (ride.status !== 'searching') {
      setSim({ ride: null, driverLocation: null, phase: 'idle' })
      return
    }

    if (ride.driver && !String(ride.id).startsWith('demo-')) {
      setSim({ ride: null, driverLocation: null, phase: 'idle' })
      return
    }

    startedRef.current = Date.now()
    const start = offsetStart(originLat, originLng)

    void fetchOsrmRoute(start.lat, start.lng, originLat, originLng).then((r) => {
      approachRef.current = r?.points?.length ? r.points : [
        [start.lat, start.lng],
        [originLat, originLng],
      ]
    })
    void fetchOsrmRoute(originLat, originLng, destLat, destLng).then((r) => {
      tripRef.current = r?.points?.length ? r.points : [
        [originLat, originLng],
        [destLat, destLng],
      ]
    })

    const driverInfo = demo?.driver || DEFAULT_DRIVER
    let timer: ReturnType<typeof setInterval>

    const tick = () => {
      const current = getDemoRide()
      if (current && String(current.id) === String(ride.id) && current.status !== 'searching') {
        clearInterval(timer)
        return
      }

      const t0 = startedRef.current ?? Date.now()
      const elapsed = Date.now() - t0

      if (elapsed < 3000) {
        setSim({ ride, driverLocation: null, phase: 'searching' })
        return
      }

      if (elapsed < 28000) {
        const progress = timedProgress(t0 + 3000, 25000)
        const loc = interpolateAlongRoute(approachRef.current, progress)
        const nextRide = { ...ride, status: 'accepted', driver: driverInfo, driver_controlled: false }
        updateDemoRide({ ...nextRide, driver_lat: loc?.lat, driver_lng: loc?.lng })
        setSim({ ride: nextRide, driverLocation: loc, phase: 'accepted' })
        return
      }

      if (elapsed < 32000) {
        const nextRide = { ...ride, status: 'pickup_arrived', driver: driverInfo, driver_controlled: false }
        updateDemoRide({ ...nextRide, driver_lat: originLat, driver_lng: originLng })
        setSim({
          ride: nextRide,
          driverLocation: { lat: originLat, lng: originLng },
          phase: 'pickup_arrived',
        })
        return
      }

      if (elapsed < 65000) {
        const progress = timedProgress(t0 + 32000, 33000)
        const loc = interpolateAlongRoute(tripRef.current, progress)
        const nextRide = { ...ride, status: 'in_progress', driver: driverInfo, driver_controlled: false }
        updateDemoRide({ ...nextRide, driver_lat: loc?.lat, driver_lng: loc?.lng })
        setSim({ ride: nextRide, driverLocation: loc, phase: 'in_progress' })
        return
      }

      const atDestination = {
        ...ride,
        status: 'destination_arrived',
        driver: driverInfo,
        driver_controlled: false,
        is_paid: false,
      } as Ride & { is_paid: boolean }
      updateDemoRide({
        ...atDestination,
        driver_lat: destLat,
        driver_lng: destLng,
      })
      setSim({
        ride: atDestination,
        driverLocation: { lat: destLat, lng: destLng },
        phase: 'destination_arrived',
      })
      clearInterval(timer)
    }

    tick()
    timer = setInterval(tick, 500)
    return () => clearInterval(timer)
  }, [enabled, ride?.id, ride?.status, ride?.origin_lat, ride?.origin_lng, ride?.dest_lat, ride?.dest_lng, ride?.driver])

  return sim
}

export function isDemoModeEnabled(token?: string | null): boolean {
  if (typeof window === 'undefined') return false
  if (token === 'demo-rider-token') return true
  return (
    new URLSearchParams(window.location.search).get('demo') === '1' ||
    window.localStorage.getItem('chama_demo') === '1'
  )
}
