import { useEffect, useRef } from 'react'
import { useRidesStore } from '@/stores/rides'
import notificationService from '@/services/notifications'

interface UseRidePollingOptions {
  rideId?: string | number
  enabled?: boolean
  intervalMs?: number
}

/** Atualiza corrida ativa via API (sem socket). */
export function useRidePolling({ rideId, enabled = true, intervalMs = 4000 }: UseRidePollingOptions) {
  useEffect(() => {
    if (!enabled || !rideId) return

    const poll = () => useRidesStore.getState().fetchRide(rideId)
    poll()
    const timer = setInterval(poll, intervalMs)
    return () => clearInterval(timer)
  }, [rideId, enabled, intervalMs])
}

/** Corridas pendentes + notificação local/push quando chega nova solicitação. */
export function usePendingRidesPolling(enabled = true, intervalMs = 5000) {
  const knownIdsRef = useRef<Set<string | number>>(new Set())
  const initializedRef = useRef(false)

  useEffect(() => {
    if (!enabled) return

    const poll = async () => {
      const prev = useRidesStore.getState().pendingRides
      const prevIds = new Set(prev.map((r) => r.id))
      await useRidesStore.getState().fetchPendingRides()
      const next = useRidesStore.getState().pendingRides

      if (!initializedRef.current) {
        next.forEach((r) => knownIdsRef.current.add(r.id))
        initializedRef.current = true
        return
      }

      for (const ride of next) {
        if (!knownIdsRef.current.has(ride.id) && !prevIds.has(ride.id)) {
          knownIdsRef.current.add(ride.id)
          await notificationService.notifyNewRideRequest(ride)
        }
      }

      knownIdsRef.current = new Set(next.map((r) => r.id))
    }

    poll()
    const timer = setInterval(poll, intervalMs)
    return () => clearInterval(timer)
  }, [enabled, intervalMs])
}
