class NotificationService {
  private permission: NotificationPermission | null = null
  private swRegistration: ServiceWorkerRegistration | null = null

  async init(): Promise<void> {
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

  async showNotification(title: string, options: NotificationOptions = {}): Promise<boolean> {
    if (this.permission !== 'granted') {
      this.permission = await Notification.requestPermission()
    }

    if (this.permission !== 'granted') return false

    const defaultOptions = {
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      vibrate: [200, 100, 200],
      requireInteraction: false,
      ...options,
    } as NotificationOptions & { vibrate?: number[]; actions?: Array<{ action: string; title: string }> }

    if (this.swRegistration) {
      await this.swRegistration.showNotification(title, defaultOptions)
    } else {
      new Notification(title, defaultOptions)
    }

    return true
  }

  async notifyNewRideRequest(ride: any): Promise<boolean> {
    return this.showNotification('Nova solicitação de corrida', {
      body: `${ride.origin_address} → ${ride.destination_address} | ${ride.estimated_fare.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
      tag: `ride-request-${ride.id}`,
      data: { rideId: ride.id, type: 'ride_request' },
      requireInteraction: true,
      ...( {
        actions: [
          { action: 'accept', title: 'Aceitar' },
          { action: 'decline', title: 'Recusar' },
        ],
      } as NotificationOptions),
    })
  }

  async notifyRideCancelledByPassenger(ride: any): Promise<boolean> {
    return this.showNotification('Corrida cancelada', {
      body: 'O passageiro cancelou a solicitação',
      tag: `ride-cancelled-${ride.id}`,
      data: { rideId: ride.id, type: 'ride_cancelled' },
    })
  }

  async notifyNewMessage(ride: any, message: string): Promise<boolean> {
    return this.showNotification('Nova mensagem', {
      body: message,
      tag: `message-${ride.id}`,
      data: { rideId: ride.id, type: 'new_message' },
    })
  }

  async notifyRideArrived(ride: any): Promise<boolean> {
    return this.showNotification('Chegou no local', {
      body: 'Você chegou ao local de embarque',
      tag: `ride-arrived-${ride.id}`,
      data: { rideId: ride.id, type: 'ride_arrived' },
      requireInteraction: true,
    })
  }

  async notifyPassengerArrived(ride: any): Promise<boolean> {
    return this.showNotification('Passageiro confirmou chegada', {
      body: 'Pode iniciar a corrida',
      tag: `passenger-arrived-${ride.id}`,
      data: { rideId: ride.id, type: 'passenger_arrived' },
    })
  }
}

export default new NotificationService()