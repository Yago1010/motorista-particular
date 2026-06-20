export interface TaximeterCategory {
  id: string
  name: string
  fare_initial: number
  fare_per_km: number
  fare_per_min: number
}

export interface TaximeterTrip {
  id: string
  category_name: string
  fare: number
  distance_m: number
  duration_sec: number
  started_at: string
  finished_at: string
}

const CATEGORIES_KEY = 'chama_taximeter_categories'
const TRIPS_KEY = 'chama_taximeter_trips'

export const defaultTaximeterCategories: TaximeterCategory[] = [
  { id: '1', name: 'Moto', fare_initial: 3, fare_per_km: 1.8, fare_per_min: 0.3 },
  { id: '2', name: 'Carro', fare_initial: 5, fare_per_km: 2, fare_per_min: 0.2 },
  { id: '3', name: 'Carro Premium', fare_initial: 10, fare_per_km: 4, fare_per_min: 0.8 },
]

export function loadTaximeterCategories(): TaximeterCategory[] {
  try {
    const raw = localStorage.getItem(CATEGORIES_KEY)
    if (!raw) return defaultTaximeterCategories
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length ? parsed : defaultTaximeterCategories
  } catch {
    return defaultTaximeterCategories
  }
}

export function saveTaximeterCategories(categories: TaximeterCategory[]) {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories))
}

export function loadTaximeterTrips(): TaximeterTrip[] {
  try {
    const raw = localStorage.getItem(TRIPS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveTaximeterTrip(trip: TaximeterTrip) {
  const trips = loadTaximeterTrips()
  trips.unshift(trip)
  localStorage.setItem(TRIPS_KEY, JSON.stringify(trips.slice(0, 200)))
}

export function clearTaximeterTrips() {
  localStorage.removeItem(TRIPS_KEY)
}

export function calcTaximeterFare(
  category: TaximeterCategory,
  distanceM: number,
  timeSec: number
) {
  const km = distanceM / 1000
  const min = timeSec / 60
  return category.fare_initial + km * category.fare_per_km + min * category.fare_per_min
}
