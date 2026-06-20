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

export function buildPixQrUrl(payload: string, size = 220): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(payload)}`
}

export function buildWhatsAppDriverLink(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, '')
  const normalized = digits.startsWith('55') ? digits : `55${digits}`
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`
}
