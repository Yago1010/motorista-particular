/** Tarifas estilo 99 — base + km + minuto, com adicional noturno / fim de semana / chuva. */

export const CHAMA_FARE_RATES: Record<string, { base: number; perKm: number; perMin: number }> = {
  Moto: { base: 3.5, perKm: 1.35, perMin: 0.22 },
  Carro: { base: 4.0, perKm: 1.7, perMin: 0.25 },
  'Carro Premium': { base: 6.0, perKm: 2.4, perMin: 0.35 },
}

const CATEGORY_MULT: Record<string, number> = {
  Moto: 0.88,
  Carro: 1,
  'Carro Premium': 1.45,
}

export interface FareBreakdown {
  estimated_fare: number
  base: number
  distance_km: number
  distance_cost: number
  time_min: number
  time_cost: number
  category_multiplier: number
  surge_multiplier: number
  surge_labels: string[]
  subtotal: number
}

export function getSurgeMultiplier(at: Date = new Date(), rain = false) {
  let multiplier = 1
  const labels: string[] = []
  const hour = at.getHours()

  if (hour >= 22 || hour < 6) {
    multiplier *= 1.15
    labels.push('Noturno +15%')
  }
  const day = at.getDay()
  if (day === 0 || day === 6) {
    multiplier *= 1.1
    labels.push('Fim de semana +10%')
  }
  if (rain) {
    multiplier *= 1.12
    labels.push('Chuva +12%')
  }

  return { multiplier: Math.min(Math.round(multiplier * 100) / 100, 1.35), labels }
}

export function calculateChamaFare(
  distanceMeters: number,
  durationSeconds: number,
  category = 'Carro',
  options?: { rain?: boolean; at?: Date }
): FareBreakdown {
  const rates = CHAMA_FARE_RATES[category] ?? CHAMA_FARE_RATES.Carro
  const catMult = CATEGORY_MULT[category] ?? 1
  const km = Math.max(0, distanceMeters) / 1000
  const min = Math.max(0, durationSeconds) / 60

  const base = rates.base * catMult
  const distance_cost = km * rates.perKm * catMult
  const time_cost = min * rates.perMin * catMult
  const subtotal = base + distance_cost + time_cost

  const { multiplier: surge_multiplier, labels: surge_labels } = getSurgeMultiplier(
    options?.at,
    options?.rain
  )

  const estimated_fare = Math.round(subtotal * surge_multiplier * 100) / 100

  return {
    estimated_fare,
    base: Math.round(base * 100) / 100,
    distance_km: Math.round(km * 100) / 100,
    distance_cost: Math.round(distance_cost * 100) / 100,
    time_min: Math.round(min),
    time_cost: Math.round(time_cost * 100) / 100,
    category_multiplier: catMult,
    surge_multiplier,
    surge_labels,
    subtotal: Math.round(subtotal * 100) / 100,
  }
}

/** Rejeita tarifa da API se estiver muito acima da fórmula local (ex.: settings legados errados). */
export function pickTrustedFare(
  localFare: number,
  serverFare?: number | null
): number {
  if (serverFare == null || serverFare <= 0) return localFare
  if (serverFare > localFare * 1.5) return localFare
  return serverFare
}

/** Corrige valor exibido quando o banco guardou tarifa legada errada. */
export function resolveRideFare(ride: {
  fare?: number
  estimated_fare?: number
  distance_km?: number
  duration_min?: number
  category?: string
}) {
  const stored = ride.fare ?? ride.estimated_fare ?? 0
  const km = ride.distance_km
  const min = ride.duration_min
  if (km == null || min == null || km <= 0) return stored
  const local = calculateChamaFare(km * 1000, min * 60, ride.category || 'Carro').estimated_fare
  return pickTrustedFare(local, stored)
}
