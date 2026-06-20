import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'
import { getDemoRide, isDemoRideId, generateDemoPixCode, markDemoRidePaid, clearDemoRide, purgeTerminalDemoRide } from '@/utils/demoRideBridge'
import { getPersistedRideSnapshot } from '@/utils/activeRideSession'
import { isRideDismissed } from '@/utils/dismissedRides'
import { useRidesStore, type Ride } from '@/stores/rides'
import { useAuthStore } from '@/stores/auth'
import { calculateChamaFare, pickTrustedFare } from '@/utils/fareCalculator'

export const rideKeys = {
  all: ['rides'] as const,
  detail: (id: string | number) => ['rides', id] as const,
  location: (id: string | number) => ['rides', id, 'location'] as const,
  active: ['rides', 'active'] as const,
  history: ['rides', 'history'] as const,
}

function normalizeRide(raw: any, id?: string | number): Ride {
  const paymentMap: Record<number, string> = { 0: 'cash', 1: 'card', 2: 'pix', 3: 'wallet' }
  const paymentMode = raw.payment_method ?? raw.payment_mode
  const driver = raw.driver
    ? {
        ...raw.driver,
        avatar: raw.driver.avatar || raw.driver.picture,
        phone: raw.driver.phone,
      }
    : undefined
  const driverLat = raw.driver_lat ?? raw.driver?.latitude ?? driver?.latitude
  const driverLng = raw.driver_lng ?? raw.driver?.longitude ?? driver?.longitude

  let status = raw.status || 'searching'
  if (raw.is_cancelled) status = 'cancelled'
  else if (raw.is_completed || raw.status === 'completed') status = 'completed'
  else if (raw.status === 'destination_arrived') status = 'destination_arrived'
  else if (raw.is_started || raw.status === 'in_progress') status = 'in_progress'
  else if (raw.is_walker_arrived || raw.status === 'pickup_arrived') status = 'pickup_arrived'
  else if (raw.confirmed_walker || raw.status === 'accepted') status = 'accepted'
  else if (raw.status === 'searching' || raw.current_walker) status = 'searching'

  return {
    id: raw.id ?? id,
    status,
    origin_address: raw.origin_address || raw.pickup_address,
    pickup_address: raw.pickup_address || raw.origin_address,
    destination_address: raw.destination_address,
    fare: raw.fare ?? raw.estimated_fare ?? raw.total,
    estimated_fare: raw.estimated_fare ?? raw.fare ?? raw.total,
    distance_km: raw.distance_km ?? (raw.distance != null ? Number(raw.distance) : undefined),
    duration_min: raw.duration_min ?? (raw.time != null ? Number(raw.time) : undefined),
    payment_method: typeof paymentMode === 'number' ? paymentMap[paymentMode] || 'cash' : paymentMode,
    origin_lat: raw.origin_lat ?? raw.owner_latitude,
    origin_lng: raw.origin_lng ?? raw.owner_longitude,
    dest_lat: raw.dest_lat ?? raw.d_latitude,
    dest_lng: raw.dest_lng ?? raw.d_longitude,
    is_paid: !!(raw.is_paid ?? raw.isPaid),
    driver_lat: driverLat != null ? Number(driverLat) : undefined,
    driver_lng: driverLng != null ? Number(driverLng) : undefined,
    driver: driver
      ? {
          ...driver,
          ...(driverLat != null ? { latitude: Number(driverLat), longitude: Number(driverLng) } : {}),
        }
      : undefined,
  } as Ride & { is_paid?: boolean; driver_lat?: number; driver_lng?: number }
}

export async function fetchRideById(id: string | number): Promise<Ride> {
  if (isDemoRideId(id)) {
    const demo = getDemoRide()
    if (demo && String(demo.id) === String(id)) {
      return normalizeRide(demo, id)
    }
    const snap = getPersistedRideSnapshot()
    if (snap && String(snap.id) === String(id)) {
      return normalizeRide(snap, id)
    }
    throw new Error('Corrida não encontrada')
  }
  try {
    const { data } = await api.get(`rider/rides/${id}`)
    return normalizeRide(data.ride || data, id)
  } catch {
    const active = await fetchActiveRide()
    if (active && String(active.id) === String(id)) {
      return active
    }
    throw new Error('Corrida não encontrada')
  }
}

export async function fetchRideLocation(id: string | number) {
  if (isDemoRideId(id)) {
    const demo = getDemoRide()
    if (demo?.driver_lat != null && demo?.driver_lng != null) {
      return {
        lat: demo.driver_lat as number,
        lng: demo.driver_lng as number,
        distance: null as string | number | null,
        time: null as number | null,
      }
    }
    return null
  }
  const { data } = await api.get(`rider/rides/${id}/location`)
  return {
    lat: data.latitude as number,
    lng: data.longitude as number,
    distance: data.distance as string | number | null,
    time: data.time as number | null,
  }
}

export async function fetchActiveRide(): Promise<Ride | null> {
  purgeTerminalDemoRide()
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('rider_token') : null
  if (token === 'demo-rider-token') {
    const demo = getDemoRide()
    if (demo && !['completed', 'cancelled'].includes(demo.status || '') && !isRideDismissed(demo.id)) {
      return normalizeRide(demo)
    }
    return null
  }
  const { data } = await api.get('rider/rides/active')
  if (!data.ride) return null
  const ride = normalizeRide(data.ride)
  if (isRideDismissed(ride.id)) return null
  return ride
}

export async function estimateFareFromServer(params: {
  distance_meters: number
  duration_seconds: number
  category_id?: number
  category?: string
}) {
  const { data } = await api.post('rides/estimate', params)
  return data as {
    estimated_fare: number
    currency?: string
    base_price?: number
    price_per_km?: number
    price_per_min?: number
  }
}

const CATEGORY_MULTIPLIERS: Record<string, number> = {
  Moto: 0.88,
  Carro: 1,
  'Carro Premium': 1.45,
}

export function calculateFareFromRoute(distanceMeters: number, durationSeconds: number, category: string) {
  return calculateChamaFare(distanceMeters, durationSeconds, category).estimated_fare
}

export function applyCategoryMultiplier(baseFare: number, category: string) {
  const mult = CATEGORY_MULTIPLIERS[category] ?? 1
  return Math.round(baseFare * mult * 100) / 100
}

export function estimateLocalFare(distanceMeters: number, durationSeconds: number) {
  return calculateChamaFare(distanceMeters, durationSeconds, 'Carro').estimated_fare
}

export function useEstimateFareQuery(
  distanceMeters: number | null,
  durationSeconds: number | null,
  categoryId: number,
  categoryName = 'Carro',
  enabled = true
) {
  return useQuery({
    queryKey: ['fare-estimate', distanceMeters, durationSeconds, categoryId],
    queryFn: async () => {
      const server = await estimateFareFromServer({
        distance_meters: distanceMeters!,
        duration_seconds: durationSeconds!,
        category_id: categoryId,
      })
      const local = calculateChamaFare(distanceMeters!, durationSeconds!, categoryName).estimated_fare
      return {
        ...server,
        estimated_fare: pickTrustedFare(local, server.estimated_fare),
      }
    },
    enabled: enabled && !!distanceMeters && !!durationSeconds && distanceMeters > 0,
    staleTime: 60_000,
    retry: 0,
  })
}

export function useRideQuery(rideId?: string | number, enabled = true) {
  const cached = useRidesStore((s) =>
    s.currentRide && rideId != null && String(s.currentRide.id) === String(rideId) ? s.currentRide : null
  )
  const persisted =
    rideId != null && String(getPersistedRideSnapshot()?.id) === String(rideId)
      ? getPersistedRideSnapshot()
      : null
  return useQuery({
    queryKey: rideKeys.detail(rideId || ''),
    queryFn: () => fetchRideById(rideId!),
    enabled: !!rideId && enabled,
    initialData: cached ?? persisted ?? undefined,
    placeholderData: (prev) => prev ?? cached ?? persisted ?? undefined,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      const paid = query.state.data?.is_paid
      if (isDemoRideId(rideId)) return 1500
      if (!status || status === 'cancelled') return false
      if (status === 'completed' && paid) return false
      return 3000
    },
  })
}

export function useDriverLocationQuery(rideId?: string | number, enabled = true) {
  return useQuery({
    queryKey: rideKeys.location(rideId || ''),
    queryFn: async () => {
      const loc = await fetchRideLocation(rideId!)
      return loc
    },
    enabled: !!rideId && enabled,
    refetchInterval: isDemoRideId(rideId) ? 1500 : 3000,
  })
}

export function useActiveRideQuery() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const authReady = useAuthStore((s) => s.authReady)
  return useQuery({
    queryKey: rideKeys.active,
    queryFn: fetchActiveRide,
    enabled: authReady && isAuthenticated,
    staleTime: 5000,
    refetchInterval: 5000,
  })
}

export function useRideHistoryQuery() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const authReady = useAuthStore((s) => s.authReady)
  return useQuery({
    queryKey: rideKeys.history,
    queryFn: async () => {
      const { data } = await api.get('rider/rides/history')
      return (data.rides || []) as any[]
    },
    enabled: authReady && isAuthenticated,
  })
}

export function useRequestRideMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.post('rider/rides/request', payload)
      return normalizeRide(data.ride || data)
    },
    onSuccess: (ride) => {
      qc.setQueryData(rideKeys.detail(ride.id), ride)
      qc.invalidateQueries({ queryKey: rideKeys.active })
    },
  })
}

export function usePayRideMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ rideId, payment_method }: { rideId: string | number; payment_method: string }) => {
      if (isDemoRideId(rideId)) {
        markDemoRidePaid(payment_method)
        return { success: true, is_paid: true }
      }
      const { data } = await api.post(`rider/rides/${rideId}/pay`, { payment_method })
      return data as { success: boolean; pix_code?: string; is_paid?: boolean; message?: string }
    },
    onSuccess: (_, { rideId }) => {
      qc.invalidateQueries({ queryKey: rideKeys.detail(rideId) })
    },
  })
}

export async function fetchRidePaymentPix(rideId: string | number) {
  if (isDemoRideId(rideId)) {
    const demo = getDemoRide()
    const amount = demo?.fare ?? demo?.estimated_fare ?? 0
    const pix_code = generateDemoPixCode(rideId, amount)
    return {
      pix_code,
      amount,
      qr_url: `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(pix_code)}`,
    }
  }
  const { data } = await api.get(`rider/rides/${rideId}/payment-pix`)
  return data as { pix_code: string; amount: number; qr_url?: string }
}

export function useRateDriverMutation() {
  return useMutation({
    mutationFn: async ({
      rideId,
      rating,
      comment,
    }: {
      rideId: string | number
      rating: number
      comment?: string
    }) => {
      if (isDemoRideId(rideId)) {
        clearDemoRide()
        return { success: true }
      }
      const { data } = await api.post(`rider/rides/${rideId}/rate`, { rating, comment })
      return data
    },
  })
}
