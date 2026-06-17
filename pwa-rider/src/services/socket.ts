import { io, Socket } from 'socket.io-client'

type EventCallback = (...args: any[]) => void

class SocketService {
  private socket: Socket | null = null
  private connected = false
  private reconnectAttempts = 0
  private readonly maxReconnectAttempts = 5
  private eventHandlers = new Map<string, EventCallback>()

  async connect(token: string, namespace = '/rider'): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve()
        return
      }

      this.socket = io(namespace, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      })

      this.socket.on('connect', () => {
        console.log('Socket connected:', this.socket?.id)
        this.connected = true
        this.reconnectAttempts = 0
        resolve()
      })

      this.socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason)
        this.connected = false
      })

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error)
        this.reconnectAttempts++
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          reject(new Error('Max reconnection attempts reached'))
        }
      })

      this.socket.on('error', (error) => {
        console.error('Socket error:', error)
      })

      this.socket.on('connect', () => {
        this.eventHandlers.forEach((callback, event) => {
          this.socket?.on(event, callback)
        })
      })
    })
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.connected = false
    }
  }

  on(event: string, callback: EventCallback): void {
    this.eventHandlers.set(event, callback)
    this.socket?.on(event, callback)
  }

  off(event: string, callback?: EventCallback): void {
    if (callback) {
      this.socket?.off(event, callback)
    } else {
      this.socket?.off(event)
    }
    this.eventHandlers.delete(event)
  }

  emit(event: string, data: unknown): void {
    this.socket?.emit(event, data)
  }

  isConnected(): boolean {
    return this.connected && this.socket?.connected === true
  }

  onRideRequest(callback: EventCallback): void { this.on('ride:request', callback) }
  onRideCancelled(callback: EventCallback): void { this.on('ride:cancelled', callback) }
  onRideAccepted(callback: EventCallback): void { this.on('ride:accepted', callback) }
  onDriverLocation(callback: EventCallback): void { this.on('driver:location', callback) }
  onRideStatusChange(callback: EventCallback): void { this.on('ride:status', callback) }
  onNewMessage(callback: EventCallback): void { this.on('message:new', callback) }
  onDriverArrived(callback: EventCallback): void { this.on('ride:driver_arrived', callback) }
  onRideStarted(callback: EventCallback): void { this.on('ride:started', callback) }
  onRideCompleted(callback: EventCallback): void { this.on('ride:completed', callback) }
}

export default new SocketService()
