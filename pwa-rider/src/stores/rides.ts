import { create } from 'zustand'
import api from '@/services/api'

export interface RideDriver {
  first_name: string
  last_name?: string
  avatar?: string
  phone?: string
  latitude?: number
  longitude?: number
  vehicle_model?: string
  vehicle_plate?: string
  vehicle_color?: string
  rating?: number
}

export interface Ride {
  id: string | number
  status: string
  pickup_address?: string
  origin_address?: string
  destination_address?: string
  fare?: number
  estimated_fare?: number
  payment_method?: string
  is_paid?: boolean
  origin_lat?: number
  origin_lng?: number
  dest_lat?: number
  dest_lng?: number
  driver?: RideDriver
}

interface DriverLocation {
  lat: number
  lng: number
}

interface RidesState {
  currentRide: Ride | null
  rideHistory: any[]
  loading: boolean
  searchingDrivers: boolean
  nearbyDrivers: any[]
  rideMessages: any[]
  hasActiveRide: boolean
  driverLocation: DriverLocation | null

  requestRide: (data: any) => Promise<{ success: boolean; ride?: any; message?: string }>
  fetchRide: (rideId: string | number) => Promise<Ride | null>
  fetchRideHistory: (params?: any) => Promise<void>
  cancelRide: (rideId: string | number, reason?: string) => Promise<{ success: boolean; message?: string }>
  rateDriver: (rideId: string | number, rating: number, comment?: string) => Promise<{ success: boolean; message?: string }>
  setCurrentRide: (ride: any) => void
  clearCurrentRide: () => void
  updateRideStatus: (status: string, data?: any) => void
  setDriverLocation: (lat: number, lng: number) => void
  simulateDriverAcceptance: () => void
  setNearbyDrivers: (drivers: any[]) => void
  sendMessage: (rideId: string | number, message: string) => Promise<{ success: boolean; message?: any }>
  getMessages: (rideId: string | number) => Promise<{ success: boolean; messages?: any[]; message?: string }>
  markMessagesAsRead: (rideId: string | number) => Promise<{ success: boolean }>
  estimateFare: (originLat: number, originLng: number, destLat: number, destLng: number, category: string) => Promise<{ success: boolean; estimate?: any; message?: string }>
  searchAddresses: (query: string) => Promise<{ success: boolean; places: any[] }>
  getNearbyDrivers: (lat: number, lng: number, category: string) => Promise<{ success: boolean; drivers: any[] }>
}

function mapLegacyStatus(raw: any): string {
  if (raw.status === 'searching' || raw.status === 0) return 'searching'
  if (raw.is_cancelled || raw.status === 'cancelled') return 'cancelled'
  if (raw.is_completed || raw.status === 'completed') return 'completed'
  if (raw.is_started || raw.is_walk_started || raw.status === 'in_progress') return 'in_progress'
  if (raw.is_walker_arrived || raw.status === 'arrived' || raw.status === 'pickup_arrived') return 'arrived'
  if (raw.confirmed_walker || raw.status === 'accepted' || raw.status === 1) return 'accepted'
  return raw.status || 'searching'
}

function normalizeRideFromApi(raw: any, rideId: string | number): Ride {
  const walker = raw.driver || raw.walker
  const paymentMode = raw.payment_method ?? raw.payment_mode
  const paymentMap: Record<number, string> = { 0: 'cash', 1: 'card', 2: 'pix', 3: 'wallet' }

  return {
    id: raw.id ?? raw.request_id ?? rideId,
    status: mapLegacyStatus(raw),
    origin_address: raw.origin_address || raw.pickup_address || raw.origin,
    pickup_address: raw.pickup_address || raw.origin_address,
    destination_address: raw.destination_address || raw.dropoff_address || raw.destination,
    fare: raw.fare ?? raw.estimated_fare ?? raw.total,
    estimated_fare: raw.estimated_fare ?? raw.fare ?? raw.total,
    payment_method: typeof paymentMode === 'number' ? paymentMap[paymentMode] || 'cash' : paymentMode,
    origin_lat: raw.origin_lat ?? raw.latitude ?? raw.owner_latitude,
    origin_lng: raw.origin_lng ?? raw.longitude ?? raw.owner_longitude,
    dest_lat: raw.dest_lat ?? raw.d_latitude ?? raw.destination_lat,
    dest_lng: raw.dest_lng ?? raw.d_longitude ?? raw.destination_lng,
    driver: walker
      ? {
          first_name: walker.first_name || walker.name || 'Motorista',
          last_name: walker.last_name,
          avatar: walker.avatar || walker.picture,
          vehicle_model: walker.vehicle_model || walker.type || walker.car_model,
          vehicle_plate: walker.vehicle_plate || walker.plate,
          vehicle_color: walker.vehicle_color || walker.color,
          rating: Number(walker.rating) || undefined,
        }
      : raw.driver,
  }
}

function extractDriverLocation(raw: any): { lat: number; lng: number } | null {
  const w = raw.driver || raw.walker
  const lat = w?.latitude ?? w?.lat ?? raw.driver_lat ?? raw.latitude
  const lng = w?.longitude ?? w?.lng ?? raw.driver_lng ?? raw.longitude
  if (lat != null && lng != null) return { lat: Number(lat), lng: Number(lng) }
  return null
}

const mockRide = (id: string | number): Ride => ({
  id,
  status: 'accepted',
  origin_address: 'Rua das Flores, 123',
  pickup_address: 'Rua das Flores, 123',
  destination_address: 'Av. Paulista, 1000',
  estimated_fare: 31.47,
  fare: 31.47,
  payment_method: 'pix',
  origin_lat: -23.5505,
  origin_lng: -46.6333,
  dest_lat: -23.5615,
  dest_lng: -46.6565,
  driver: {
    first_name: 'Carlos',
    last_name: 'Silva',
    rating: 4.9,
    vehicle_model: 'Corolla',
    vehicle_plate: 'ABC-1234',
    vehicle_color: 'Prata',
  },
})

export const useRidesStore = create<RidesState>((set, get) => ({
  currentRide: null,
  rideHistory: [],
  loading: false,
  searchingDrivers: false,
  nearbyDrivers: [],
  rideMessages: [],
  hasActiveRide: false,
  driverLocation: null,

  requestRide: async (data) => {
    set({ loading: true })
    try {
      const categoryId =
        data.category_id ??
        ({ Moto: 1, Carro: 2, 'Carro Premium': 3 }[data.category as string] ?? 2)
      const response = await api.post('rider/rides/request', {
        ...data,
        category_id: categoryId,
      })
      const ride = response.data.ride
      set({ currentRide: ride, searchingDrivers: true, hasActiveRide: true, loading: false })
      return { success: true, ride }
    } catch (error: any) {
      set({ loading: false })
      return {
        success: false,
        message: error.response?.data?.message || error.response?.data?.error || 'Não foi possível solicitar a corrida.',
      }
    }
  },

  fetchRide: async (rideId) => {
    set({ loading: true })
    try {
      const response = await api.get(`rider/rides/${rideId}`)
      const raw = response.data?.ride || response.data
      const ride = normalizeRideFromApi(raw, rideId)
      const driverLoc = extractDriverLocation(raw)
      set({
        currentRide: ride,
        hasActiveRide: true,
        loading: false,
        driverLocation: driverLoc ?? get().driverLocation,
      })
      return ride
    } catch (error: any) {
      set({ loading: false })
      return null
    }
  },

  fetchRideHistory: async (params = {}) => {
    set({ loading: true })
    try {
      const response = await api.get('rider/rides/history', { params })
      set({ rideHistory: response.data, loading: false })
    } catch (error) {
      console.error('Fetch ride history error:', error)
      set({ loading: false })
    }
  },

  cancelRide: async (rideId, reason) => {
    try {
      await api.post(`rider/rides/${rideId}/cancel`, { reason })
    } catch {
      // fallback offline
    }
    set({ currentRide: null, searchingDrivers: false, hasActiveRide: false, driverLocation: null })
    return { success: true }
  },

  rateDriver: async (rideId, rating, comment) => {
    try {
      await api.post(`rider/rides/${rideId}/rate`, { rating, comment })
      return { success: true }
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Erro ao avaliar motorista' }
    }
  },

  setCurrentRide: (ride) => {
    set({
      currentRide: ride,
      searchingDrivers: ride?.status === 'searching',
      hasActiveRide: !!ride,
    })
  },

  clearCurrentRide: () => {
    set({ currentRide: null, searchingDrivers: false, hasActiveRide: false, driverLocation: null })
  },

  updateRideStatus: (status, data = {}) => {
    const { currentRide } = get()
    const driverData = data.driver || (data.first_name ? data : null)
    if (currentRide) {
      const updatedRide: Ride = {
        ...currentRide,
        ...data,
        status,
        driver: driverData
          ? { ...currentRide.driver, ...driverData }
          : currentRide.driver,
      }
      set({
        currentRide: updatedRide,
        searchingDrivers: status === 'searching',
      })

      if (data.latitude != null || data.lat != null) {
        const lat = data.latitude ?? data.lat
        const lng = data.longitude ?? data.lng
        set({ driverLocation: { lat, lng } })
      }

      if (['completed', 'cancelled'].includes(status)) {
        set({ searchingDrivers: false })
      }
    } else if (data) {
      set({ currentRide: { ...data, status, driver: driverData } as Ride, hasActiveRide: true })
    }
  },

  simulateDriverAcceptance: () => {
    const { currentRide } = get()
    if (!currentRide) return

    const originLat = currentRide.origin_lat ?? -23.5505
    const originLng = currentRide.origin_lng ?? -46.6333
    const driverLat = originLat + 0.008
    const driverLng = originLng + 0.006

    const updatedRide: Ride = {
      ...currentRide,
      status: 'accepted',
      driver: {
        first_name: 'Carlos',
        last_name: 'Silva',
        rating: 4.9,
        vehicle_model: 'Toyota Corolla',
        vehicle_plate: 'ABC-1D23',
        vehicle_color: 'Prata',
        avatar: undefined,
      },
    }

    set({
      currentRide: updatedRide,
      searchingDrivers: false,
      driverLocation: { lat: driverLat, lng: driverLng },
    })
  },

  setDriverLocation: (lat, lng) => {
    set({ driverLocation: { lat, lng } })
  },

  setNearbyDrivers: (drivers) => {
    set({ nearbyDrivers: drivers })
  },

  sendMessage: async (rideId, message) => {
    try {
      const response = await api.post(`rider/rides/${rideId}/messages`, { message })
      return { success: true, message: response.data }
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Erro ao enviar mensagem' }
    }
  },

  getMessages: async (rideId) => {
    try {
      const response = await api.get(`rider/rides/${rideId}/messages`)
      return { success: true, messages: response.data }
    } catch (error: any) {
      return {
        success: true,
        messages: [{ id: 1, message: 'Estou a caminho!', is_driver: true, sender_name: 'Motorista', created_at: new Date().toISOString() }],
      }
    }
  },

  markMessagesAsRead: async (rideId) => {
    try {
      await api.post(`rider/rides/${rideId}/messages/read`)
      return { success: true }
    } catch {
      return { success: true }
    }
  },

  estimateFare: async (originLat, originLng, destLat, destLng, category) => {
    try {
      const response = await api.post('rides/estimate', {
        origin_lat: originLat,
        origin_lng: originLng,
        dest_lat: destLat,
        dest_lng: destLng,
        category,
      })
      return { success: true, estimate: response.data }
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Erro ao estimar preço' }
    }
  },

  searchAddresses: async (query: string, lat?: number, lng?: number) => {
    try {
      const params: Record<string, string | number> = { q: query, limit: 8 }
      if (lat != null && lng != null) {
        params.lat = lat
        params.lng = lng
        params.radius_km = 35
      }
      const response = await api.get('/places/search', { params })
      return { success: true, places: response.data.places || response.data }
    } catch {
      return { success: false, places: [] }
    }
  },

  getNearbyDrivers: async (lat, lng, category) => {
    try {
      const response = await api.get('drivers/nearby', {
        params: { lat, lng, category },
      })
      return { success: true, drivers: response.data.drivers || response.data }
    } catch {
      return { success: false, drivers: [] }
    }
  },
}))
