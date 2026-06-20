import { useEffect, useRef, useState } from 'react'
import type { Ride } from '@/stores/rides'
import { interpolateAlongRoute, timedProgress } from '@/utils/rideSimulation'

type SimPhase = 'idle' | 'searching' | 'accepted' | 'pickup_arrived' | 'in_progress' | 'completed'

interface SimState {
  ride: Ride | null
  driverLocation: { lat: number; lng: number } | null
  phase: SimPhase
}

/** Simula motorista no mapa quando ?demo=1 ou localStorage chama_demo=1 */
export function useDemoRideSimulation(
  ride: Ride | null | undefined,
  enabled: boolean
): SimState {
  const [sim, setSim] = useState<SimState>({ ride: null, driverLocation: null, phase: 'idle' })
  const startedRef = useRef<number | null>(null)
  const approachRef = useRef<[number, number][]>([])
  const tripRef = useRef<[number, number][]>([])

  useEffect(() => {
    if (!enabled || !ride?.origin_lat || !ride?.origin_lng) {
      setSim({ ride: null, driverLocation: null, phase: 'idle' })
      return
    }

    if (ride.driver && ride.status !== 'searching') {
      setSim({ ride: null, driverLocation: null, phase: 'idle' })
      return
    }

    if (ride.status !== 'searching') {
      setSim({ ride: null, driverLocation: null, phase: 'idle' })
      return
    }

    startedRef.current = Date.now()
    const originLat = ride.origin_lat
    const originLng = ride.origin_lng
    const destLat = ride.dest_lat ?? originLat + 0.02
    const destLng = ride.dest_lng ?? originLng + 0.02
    const startLat = originLat - 0.008
    const startLng = originLng - 0.006

    approachRef.current = [
      [startLat, startLng],
      [originLat - 0.003, originLng - 0.002],
      [originLat, originLng],
    ]
    tripRef.current = [
      [originLat, originLng],
      [(originLat + destLat) / 2, (originLng + destLng) / 2],
      [destLat, destLng],
    ]

    const fakeDriver = {
      first_name: 'João',
      last_name: 'Silva',
      phone: '11999990000',
      vehicle_model: 'Corolla',
      vehicle_plate: 'ABC1D23',
      rating: 4.9,
    }

    let timer: ReturnType<typeof setInterval>

    const tick = () => {
      const t0 = startedRef.current ?? Date.now()
      const elapsed = Date.now() - t0

      if (elapsed < 4000) {
        setSim({ ride, driverLocation: null, phase: 'searching' })
        return
      }

      if (elapsed < 28000) {
        const progress = timedProgress(t0 + 4000, 24000)
        const loc = interpolateAlongRoute(approachRef.current, progress)
        setSim({
          ride: {
            ...ride,
            status: 'accepted',
            driver: fakeDriver,
          },
          driverLocation: loc,
          phase: 'accepted',
        })
        return
      }

      if (elapsed < 32000) {
        setSim({
          ride: { ...ride, status: 'pickup_arrived', driver: fakeDriver },
          driverLocation: { lat: originLat, lng: originLng },
          phase: 'pickup_arrived',
        })
        return
      }

      if (elapsed < 62000) {
        const progress = timedProgress(t0 + 32000, 30000)
        const loc = interpolateAlongRoute(tripRef.current, progress)
        setSim({
          ride: { ...ride, status: 'in_progress', driver: fakeDriver },
          driverLocation: loc,
          phase: 'in_progress',
        })
        return
      }

      setSim({
        ride: { ...ride, status: 'completed', driver: fakeDriver, is_paid: false } as Ride & { is_paid: boolean },
        driverLocation: { lat: destLat, lng: destLng },
        phase: 'completed',
      })
      clearInterval(timer)
    }

    tick()
    timer = setInterval(tick, 1500)
    return () => clearInterval(timer)
  }, [enabled, ride?.id, ride?.status, ride?.origin_lat, ride?.origin_lng, ride?.dest_lat, ride?.dest_lng, ride?.driver])

  return sim
}

export function isDemoModeEnabled(): boolean {
  if (typeof window === 'undefined') return false
  return (
    new URLSearchParams(window.location.search).get('demo') === '1' ||
    window.localStorage.getItem('chama_demo') === '1'
  )
}
