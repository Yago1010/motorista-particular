import api from '@/services/api'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

export async function fetchVapidPublicKey(): Promise<string | null> {
  try {
    const { data } = await api.get('driver/push/vapid-public-key')
    return data.publicKey || null
  } catch {
    return null
  }
}

export async function subscribeToPush(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push não suportado neste navegador')
    return false
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return false

  const publicKey = await fetchVapidPublicKey()
  if (!publicKey || publicKey.includes('REPLACE')) {
    console.warn('VAPID não configurado no servidor — usando notificações locais via polling')
    return false
  }

  const registration = await navigator.serviceWorker.ready
  let subscription = await registration.pushManager.getSubscription()

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    })
  }

  const json = subscription.toJSON()
  await api.post('driver/push/subscribe', {
    endpoint: json.endpoint,
    keys: json.keys,
  })

  return true
}

export async function unsubscribeFromPush(): Promise<void> {
  try {
    await api.post('driver/push/unsubscribe')
    const registration = await navigator.serviceWorker.ready
    const sub = await registration.pushManager.getSubscription()
    if (sub) await sub.unsubscribe()
  } catch {
    /* ignore */
  }
}
