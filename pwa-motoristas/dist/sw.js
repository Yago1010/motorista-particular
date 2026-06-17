// Service Worker for PWA - Uber Clone 2025 Motorista
const CACHE_NAME = 'uber-clone-driver-v1'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-72.png',
  '/icons/icon-96.png',
  '/icons/icon-128.png',
  '/icons/icon-144.png',
  '/icons/icon-152.png',
  '/icons/icon-192.png',
  '/icons/icon-384.png',
  '/icons/icon-512.png'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        const namesToDelete = cacheNames.filter((name) => name !== CACHE_NAME)
        return Promise.all(namesToDelete.map((name) => caches.delete(name)))
      })
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  if (!event.request.url.startsWith('http')) return

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone))
        }
        return response
      })
      .catch(() => caches.match(event.request))
  )
})

self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()
  const options = {
    body: data.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    vibrate: [200, 100, 200],
    data: data.data,
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
    tag: data.tag
  }

  event.waitUntil(self.registration.showNotification(data.title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const data = event.notification.data
  const action = event.action

  if (action === 'accept' && data.rideId) {
    event.waitUntil(
      fetch(`/api/driver/rides/${data.rideId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
    )
    event.waitUntil(clients.openWindow(`/ride/${data.rideId}`))
    return
  }

  if (action === 'decline' && data.rideId) {
    event.waitUntil(
      fetch(`/api/driver/rides/${data.rideId}/decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
    )
    return
  }

  let url = '/'
  if (data.rideId) {
    url = `/ride/${data.rideId}`
  } else if (data.type === 'message') {
    url = `/chat/${data.rideId}`
  }

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})

self.addEventListener('sync', (event) => {
  if (event.tag === 'send-messages') event.waitUntil(sendQueuedMessages())
  if (event.tag === 'update-location') event.waitUntil(sendQueuedLocations())
})

async function sendQueuedMessages() { console.log('Syncing queued messages...') }
async function sendQueuedLocations() { console.log('Syncing queued locations...') }

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-location') event.waitUntil(updateDriverLocation())
})

async function updateDriverLocation() { console.log('Periodic location update...') }