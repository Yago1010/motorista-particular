/** Mesma chave que {@link ../pages/DestinationSearchPage}. */

export const LS_RECENT_DEST = 'pwa_chama_recent_destinations'

export type RecentDestination = {
  id: string
  primaryText: string
  secondaryText: string
  lat: number
  lng: number
  at: number
}

export function readRecentDestinations(): RecentDestination[] {
  try {
    const raw = localStorage.getItem(LS_RECENT_DEST)
    if (!raw) return []
    const list = JSON.parse(raw) as RecentDestination[]
    return Array.isArray(list) ? list.slice(0, 12) : []
  } catch {
    return []
  }
}

export function pushRecentDestination(item: Omit<RecentDestination, 'id' | 'at'>): void {
  try {
    const existing = readRecentDestinations()
    const next: RecentDestination = {
      ...item,
      id: `${Math.round(item.lat * 1e6)}:${Math.round(item.lng * 1e6)}`,
      at: Date.now(),
    }
    const deduped = [next, ...existing.filter((x) => x.id !== next.id)].slice(0, 10)
    localStorage.setItem(LS_RECENT_DEST, JSON.stringify(deduped))
  } catch {
    /* ignora */
  }
}
