import type { Ride } from '@/stores/rides'

const RIDE_ID_KEY = 'chama_active_ride_id'
const RIDE_SNAP_KEY = 'chama_active_ride_snap'

export function getPersistedActiveRideId(): string | null {
  try {
    return localStorage.getItem(RIDE_ID_KEY)
  } catch {
    return null
  }
}

export function persistActiveRideId(id: string | number | null) {
  try {
    if (id == null) {
      localStorage.removeItem(RIDE_ID_KEY)
      return
    }
    localStorage.setItem(RIDE_ID_KEY, String(id))
  } catch {
    /* ignore */
  }
}

export function getPersistedRideSnapshot(): Ride | null {
  try {
    const raw = localStorage.getItem(RIDE_SNAP_KEY)
    return raw ? (JSON.parse(raw) as Ride) : null
  } catch {
    return null
  }
}

export function persistRideSnapshot(ride: Ride | null) {
  try {
    if (!ride) {
      localStorage.removeItem(RIDE_SNAP_KEY)
      return
    }
    localStorage.setItem(RIDE_SNAP_KEY, JSON.stringify(ride))
  } catch {
    /* ignore */
  }
}

export function clearActiveRideSession() {
  persistActiveRideId(null)
  persistRideSnapshot(null)
}
