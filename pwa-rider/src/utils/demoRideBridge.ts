import type { Ride } from '@/stores/rides'

const DEMO_RIDE_KEY = 'chama_demo_ride'

export interface DemoRidePayload extends Ride {
  updatedAt?: number
  distance_meters?: number
  duration_seconds?: number
  category?: string
  passenger_name?: string
  driver?: Ride['driver']
  driver_lat?: number
  driver_lng?: number
  is_paid?: boolean
  /** true quando motorista real aceitou pelo app (não simulação automática) */
  driver_controlled?: boolean
}

export function generateDemoPixCode(rideId: string | number, amount: number) {
  const cents = String(Math.round(amount * 100))
  return `00020126580014BR.GOV.BCB.PIX0136chama-demo-ride-${rideId}-${cents}`
}

export function markDemoRidePaid(paymentMethod: string) {
  const current = getDemoRide()
  if (!current) return null
  const patch: Partial<DemoRidePayload> = { is_paid: true, payment_method: paymentMethod }
  // Solo (simulação): após pagar no destino, encerra automaticamente
  if (!current.driver_controlled && current.status === 'destination_arrived') {
    patch.status = 'completed'
  }
  return updateDemoRide(patch)
}

export function isDemoRiderToken(token: string | null | undefined) {
  return token === 'demo-rider-token'
}

export function isDemoDriverToken(token: string | null | undefined) {
  return token === 'demo-driver-token'
}

export function isDemoRideId(id: string | number | undefined) {
  return String(id ?? '').startsWith('demo-')
}

export function publishDemoRide(ride: DemoRidePayload) {
  try {
    localStorage.setItem(
      DEMO_RIDE_KEY,
      JSON.stringify({ ...ride, status: ride.status || 'searching', updatedAt: Date.now() })
    )
  } catch {
    /* ignore */
  }
}

export function getDemoRide(): DemoRidePayload | null {
  try {
    const raw = localStorage.getItem(DEMO_RIDE_KEY)
    return raw ? (JSON.parse(raw) as DemoRidePayload) : null
  } catch {
    return null
  }
}

export function updateDemoRide(patch: Partial<DemoRidePayload>): DemoRidePayload | null {
  const current = getDemoRide()
  if (!current) return null
  const next = { ...current, ...patch, updatedAt: Date.now() }
  try {
    localStorage.setItem(DEMO_RIDE_KEY, JSON.stringify(next))
  } catch {
    /* ignore */
  }
  return next
}

export function clearDemoRide() {
  try {
    localStorage.removeItem(DEMO_RIDE_KEY)
  } catch {
    /* ignore */
  }
}

/** Remove corrida demo finalizada/cancelada do storage (ex.: após reload). */
export function purgeTerminalDemoRide(): boolean {
  const ride = getDemoRide()
  if (ride && ['completed', 'cancelled'].includes(ride.status || '')) {
    clearDemoRide()
    return true
  }
  return false
}

export function getActiveDemoRide(): DemoRidePayload | null {
  purgeTerminalDemoRide()
  return getDemoRide()
}

export function shouldSimulateRide(token: string | null | undefined) {
  return (
    isDemoRiderToken(token) ||
    isDemoRideId(getDemoRide()?.id) ||
    localStorage.getItem('chama_demo') === '1'
  )
}
