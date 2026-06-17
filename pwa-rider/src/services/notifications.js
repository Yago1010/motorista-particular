class NotificationService {
  constructor() {
    this.permission = null
    this.swRegistration = null
  }

  async init() {
    // Verificar suporte a Service Workers
    if ('serviceWorker' in navigator) {
      try {
        this.swRegistration = await navigator.serviceWorker.ready
      } catch (error) {
        console.warn('Service Worker not ready:', error)
      }
    }

    // Solicitar permissão de notificação
    if ('Notification' in window) {
      this.permission = await Notification.requestPermission()
    }
  }

  // Mostrar notificação local
  async showNotification(title, options = {}) {
    if (this.permission !== 'granted') {
      this.permission = await Notification.requestPermission()
    }

    if (this.permission !== 'granted') {
      console.warn('Notification permission not granted')
      return false
    }

    const defaultOptions = {
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      vibrate: [200, 100, 200],
      requireInteraction: false,
      ...options
    }

    if (this.swRegistration) {
      await this.swRegistration.showNotification(title, defaultOptions)
    } else {
      new Notification(title, defaultOptions)
    }

    return true
  }

  // Notificações específicas do rider
  async notifyRideRequested(ride) {
    return this.showNotification('Nova corrida solicitada', {
      body: `De ${ride.origin_address} para ${ride.destination_address}`,
      tag: `ride-request-${ride.id}`,
      data: { rideId: ride.id, type: 'ride_request' },
      actions: [
        { action: 'accept', title: 'Aceitar' },
        { action: 'decline', title: 'Recusar' }
      ]
    })
  }

  async notifyDriverAccepted(ride) {
    return this.showNotification('Motorista aceitou', {
      body: `${ride.driver.name} está a caminho`,
      tag: `ride-accepted-${ride.id}`,
      data: { rideId: ride.id, type: 'driver_accepted' }
    })
  }

  async notifyDriverArrived(ride) {
    return this.showNotification('Motorista chegou', {
      body: 'Seu motorista está no local de embarque',
      tag: `ride-arrived-${ride.id}`,
      data: { rideId: ride.id, type: 'driver_arrived' },
      requireInteraction: true
    })
  }

  async notifyRideStarted(ride) {
    return this.showNotification('Corrida iniciada', {
      body: 'Boa viagem!',
      tag: `ride-started-${ride.id}`,
      data: { rideId: ride.id, type: 'ride_started' }
    })
  }

  async notifyRideCompleted(ride) {
    return this.showNotification('Corrida finalizada', {
      body: `Valor: ${ride.final_fare.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
      tag: `ride-completed-${ride.id}`,
      data: { rideId: ride.id, type: 'ride_completed' }
    })
  }

  async notifyRideCancelled(ride, reason) {
    return this.showNotification('Corrida cancelada', {
      body: reason || 'A corrida foi cancelada',
      tag: `ride-cancelled-${ride.id}`,
      data: { rideId: ride.id, type: 'ride_cancelled' }
    })
  }

  async notifyNewMessage(ride, message) {
    return this.showNotification('Nova mensagem', {
      body: message,
      tag: `message-${ride.id}`,
      data: { rideId: ride.id, type: 'new_message' }
    })
  }

  // Notificações específicas do motorista
  async notifyNewRideRequest(ride) {
    return this.showNotification('Nova solicitação de corrida', {
      body: `${ride.origin_address} → ${ride.destination_address} | ${ride.estimated_fare.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
      tag: `ride-request-${ride.id}`,
      data: { rideId: ride.id, type: 'ride_request' },
      requireInteraction: true,
      actions: [
        { action: 'accept', title: 'Aceitar' },
        { action: 'decline', title: 'Recusar' }
      ]
    })
  }

  async notifyRideCancelledByPassenger(ride) {
    return this.showNotification('Corrida cancelada pelo passageiro', {
      body: 'O passageiro cancelou a solicitação',
      tag: `ride-cancelled-${ride.id}`,
      data: { rideId: ride.id, type: 'ride_cancelled' }
    })
  }
}

export default new NotificationService()