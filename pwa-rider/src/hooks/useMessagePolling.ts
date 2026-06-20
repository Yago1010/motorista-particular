import { useEffect } from 'react'
import { useRidesStore } from '@/stores/rides'

/** Passageiro recebe mensagens via polling (sem socket). */
export function useMessagePolling(
  rideId: string | number | undefined,
  onMessages: (messages: any[]) => void,
  intervalMs = 3000
) {
  useEffect(() => {
    if (!rideId) return

    const poll = async () => {
      const result = await useRidesStore.getState().getMessages(rideId)
      if (result.success && result.messages) {
        onMessages(result.messages)
      }
    }

    poll()
    const timer = setInterval(poll, intervalMs)
    return () => clearInterval(timer)
  }, [rideId, intervalMs, onMessages])
}
