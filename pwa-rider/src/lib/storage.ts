import type { RiderSession } from '../types'

const SESSION_KEY = 'pwa-rider-session'

export function readSession(): RiderSession | null {
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as RiderSession
  } catch {
    localStorage.removeItem(SESSION_KEY)
    return null
  }
}

export function saveSession(session: RiderSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY)
}
