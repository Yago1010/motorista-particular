import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/stores/auth'
import socketService from '@/services/socket'

interface ChatMessagePayload {
  rideId?: string | number
  message?: string
  text?: string
  is_driver?: boolean
  sender_name?: string
  created_at?: string
  id?: number | string
}

interface UseChatSocketOptions {
  rideId?: string | number
  onMessage?: (payload: ChatMessagePayload) => void
}

/**
 * Socket usado SOMENTE no chat do motorista.
 * Corridas e localização usam polling/API.
 */
export function useChatSocket({ rideId, onMessage }: UseChatSocketOptions) {
  const connectedRef = useRef(false)
  const token = useAuthStore((s) => s.token)

  useEffect(() => {
    if (!rideId || !token || !onMessage) return

    let active = true

    const connect = async () => {
      try {
        await socketService.connect(token, '/driver')
        connectedRef.current = true
        socketService.emit('join:ride', { rideId })
        socketService.on('message:new', (payload: ChatMessagePayload) => {
          if (!active) return
          if (payload.rideId != null && String(payload.rideId) !== String(rideId)) return
          onMessage(payload)
        })
      } catch (error) {
        console.warn('Chat socket indisponível, use polling de mensagens.', error)
      }
    }

    connect()

    return () => {
      active = false
      socketService.off('message:new')
      if (connectedRef.current) {
        socketService.emit('leave:ride', { rideId })
      }
    }
  }, [rideId, token, onMessage])

  const notifyMessageSent = (message: string) => {
    if (!rideId || !connectedRef.current) return
    socketService.emit('message:send', { rideId, message, from: 'driver' })
  }

  return { notifyMessageSent }
}
