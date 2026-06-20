const DISMISSED_KEY = 'chama_dismissed_ride_ids'

function readIds(): string[] {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY)
    const parsed = raw ? (JSON.parse(raw) as string[]) : []
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    return []
  }
}

export function isRideDismissed(rideId: string | number | null | undefined): boolean {
  if (rideId == null || rideId === '') return false
  return readIds().includes(String(rideId))
}

export function dismissRide(rideId: string | number) {
  try {
    const ids = readIds()
    const id = String(rideId)
    if (!ids.includes(id)) {
      localStorage.setItem(DISMISSED_KEY, JSON.stringify([id, ...ids].slice(0, 30)))
    }
  } catch {
    /* ignore */
  }
}

export function undismissRide(rideId: string | number) {
  try {
    const id = String(rideId)
    const next = readIds().filter((x) => x !== id)
    if (next.length) localStorage.setItem(DISMISSED_KEY, JSON.stringify(next))
    else localStorage.removeItem(DISMISSED_KEY)
  } catch {
    /* ignore */
  }
}

export function clearDismissedRides() {
  try {
    localStorage.removeItem(DISMISSED_KEY)
  } catch {
    /* ignore */
  }
}
