interface AppNotificationOptions extends globalThis.NotificationOptions {
  tag?: string
  data?: Record<string, unknown>
  actions?: Array<{ action: string; title: string }>
  vibrate?: number[]
  requireInteraction?: boolean
}

class NotificationService {
  private permission: NotificationPermission | null = null
  private swRegistration: ServiceWorkerRegistration | null = null

  async init() {
    if ('serviceWorker' in navigator) {
      try {
        this.swRegistration = await navigator.serviceWorker.ready
      } catch (error) {
        console.warn('Service Worker not ready:', error)
      }
    }

    if ('Notification' in window) {
      this.permission = await Notification.requestPermission()
    }
  }

  async showNotification(title: string, options: AppNotificationOptions = {}) {
    if (this.permission !== 'granted') {
      this.permission = await Notification.requestPermission()
    }

    if (this.permission !== 'granted') {
      console.warn('Notification permission not granted')
      return false
    }

    const defaultOptions: AppNotificationOptions = {
      icon: '/pwa-rider/icons/icon-192.png',
      badge: '/pwa-rider/icons/badge-72.png',
      vibrate: [200, 100, 200],
      requireInteraction: false,
      ...options,
    }

    if (this.swRegistration) {
      await this.swRegistration.showNotification(title, defaultOptions)
    } else {
      new Notification(title, defaultOptions)
    }

    return true
  }

  async notifyDriverAccepted(ride: any) {
    const driverName = ride.driver?.first_name || ride.driver?.name || 'Motorista'
    return this.showNotification('Motorista aceitou', {
      body: `${driverName} está a caminho`,
      tag: `ride-accepted-${ride.id}`,
      data: { rideId: ride.id, type: 'driver_accepted' },
    })
  }

  async notifyDriverArrived(ride: any) {
    return this.showNotification('Motorista chegou', {
      body: 'Seu motorista está no local de embarque',
      tag: `ride-arrived-${ride.id}`,
      data: { rideId: ride.id, type: 'driver_arrived' },
      requireInteraction: true,
    })
  }

  async notifyRideStarted(ride: any) {
    return this.showNotification('Corrida iniciada', {
      body: 'Boa viagem!',
      tag: `ride-started-${ride.id}`,
      data: { rideId: ride.id, type: 'ride_started' },
    })
  }

  async notifyRideCompleted(ride: any) {
    const fare = ride.final_fare ?? ride.estimated_fare ?? ride.fare ?? 0
    return this.showNotification('Corrida finalizada', {
      body: `Valor: ${Number(fare).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
      tag: `ride-completed-${ride.id}`,
      data: { rideId: ride.id, type: 'ride_completed' },
    })
  }

  async notifyRideCancelled(ride: any, reason?: string) {
    return this.showNotification('Corrida cancelada', {
      body: reason || 'A corrida foi cancelada',
      tag: `ride-cancelled-${ride.id}`,
      data: { rideId: ride.id, type: 'ride_cancelled' },
    })
  }

  async notifyNewMessage(ride: any, message: string) {
    return this.showNotification('Nova mensagem', {
      body: message,
      tag: `message-${ride.id}`,
      data: { rideId: ride.id, type: 'new_message' },
    })
  }
}

export default new NotificationService()
