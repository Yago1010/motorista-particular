/** Interpola posição do motorista ao longo de uma rota (demo / fallback quando GPS atrasa). */

export function lerpCoord(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  t: number
): { lat: number; lng: number } {
  const k = Math.max(0, Math.min(1, t))
  return {
    lat: from.lat + (to.lat - from.lat) * k,
    lng: from.lng + (to.lng - from.lng) * k,
  }
}

export function interpolateAlongRoute(
  points: [number, number][],
  progress: number
): { lat: number; lng: number } | null {
  if (!points.length) return null
  if (points.length === 1) return { lat: points[0][0], lng: points[0][1] }
  const k = Math.max(0, Math.min(1, progress))
  const idx = k * (points.length - 1)
  const i = Math.floor(idx)
  const j = Math.min(i + 1, points.length - 1)
  const t = idx - i
  return lerpCoord({ lat: points[i][0], lng: points[i][1] }, { lat: points[j][0], lng: points[j][1] }, t)
}

/** Progresso 0→1 ao longo do tempo (ciclo ~90s). */
export function timedProgress(startedAtMs: number, durationMs = 90000): number {
  return Math.min(1, (Date.now() - startedAtMs) / durationMs)
}

function haversineM(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000
  const dLat = ((bLat - aLat) * Math.PI) / 180
  const dLng = ((bLng - aLng) * Math.PI) / 180
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

/** Progresso 0→1 do ponto mais próximo na rota. */
export function progressOnRoute(
  points: [number, number][],
  lat: number,
  lng: number
): number {
  if (!points.length) return 0
  if (points.length === 1) return 1

  let bestIdx = 0
  let bestDist = Infinity
  for (let i = 0; i < points.length; i++) {
    const d = haversineM(points[i][0], points[i][1], lat, lng)
    if (d < bestDist) {
      bestDist = d
      bestIdx = i
    }
  }
  return bestIdx / (points.length - 1)
}

/** Trecho percorrido da rota até a posição atual do motorista. */
export function sliceRouteTraveled(
  points: [number, number][],
  lat: number,
  lng: number
): [number, number][] {
  if (!points.length) return []
  let bestIdx = 0
  let bestDist = Infinity
  for (let i = 0; i < points.length; i++) {
    const d = haversineM(points[i][0], points[i][1], lat, lng)
    if (d < bestDist) {
      bestDist = d
      bestIdx = i
    }
  }
  const traveled = points.slice(0, bestIdx + 1)
  traveled.push([lat, lng])
  return traveled
}

/** Trecho restante da rota a partir do motorista. */
export function sliceRouteRemaining(
  points: [number, number][],
  lat: number,
  lng: number
): [number, number][] {
  if (!points.length) return [[lat, lng]]
  let bestIdx = 0
  let bestDist = Infinity
  for (let i = 0; i < points.length; i++) {
    const d = haversineM(points[i][0], points[i][1], lat, lng)
    if (d < bestDist) {
      bestDist = d
      bestIdx = i
    }
  }
  return [[lat, lng], ...points.slice(bestIdx + 1)]
}

export function buildPixQrUrl(payload: string, size = 220): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(payload)}`
}

export function buildWhatsAppDriverLink(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, '')
  const normalized = digits.startsWith('55') ? digits : `55${digits}`
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`
}
