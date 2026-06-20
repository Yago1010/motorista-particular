import { useEffect, useRef } from 'react'
import { useRidesStore } from '@/stores/rides'

interface UseRidePollingOptions {
  rideId?: string | number
  enabled?: boolean
  intervalMs?: number
  onStatusChange?: (status: string) => void
}

/** Atualiza status/localização da corrida via API (sem socket). */
export function useRidePolling({
  rideId,
  enabled = true,
  intervalMs = 4000,
  onStatusChange,
}: UseRidePollingOptions) {
  const lastStatusRef = useRef<string | null>(null)

  useEffect(() => {
    if (!enabled || !rideId) return

    const poll = async () => {
      const ride = await useRidesStore.getState().fetchRide(rideId)
      if (ride && ride.status !== lastStatusRef.current) {
        lastStatusRef.current = ride.status
        onStatusChange?.(ride.status)
      }
    }

    poll()
    const timer = setInterval(poll, intervalMs)
    return () => clearInterval(timer)
  }, [rideId, enabled, intervalMs, onStatusChange])
}
