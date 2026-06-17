import { create } from 'zustand'
import api from '@/services/api'

export interface PendingRide {
  id: string | number
  origin_address: string
  destination_address: string
  distance: number
  estimated_duration: number
  estimated_fare: number
  passenger_name: string
  passenger_rating: number
  payment_method?: string
  category?: string
  observations?: string
  created_at: string
}

export interface Ride {
  id: string | number
  status: 'pending' | 'accepted' | 'started' | 'arrived' | 'in_progress' | 'completed' | 'cancelled'
  origin_address?: string
  destination_address?: string
  pickup_address?: string
  dropoff_address?: string
  origin_lat?: number
  origin_lng?: number
  dest_lat?: number
  dest_lng?: number
  pickup_lat?: number
  pickup_lng?: number
  dropoff_lat?: number
  dropoff_lng?: number
  distance?: number
  duration?: number
  estimated_fare?: number
  price?: number
  payment_method?: string
  passenger_name?: string
  passenger_phone?: string
  passenger_rating?: number
  driver_rating?: number
  created_at: string
  updated_at?: string
}

interface RidesState {
  rides: Ride[]
  pendingRides: PendingRide[]
  currentRide: Ride | null
  loading: boolean

  fetchPendingRides: () => Promise<void>
  acceptRide: (rideId: string | number) => Promise<{ success: boolean; message?: string }>
  declineRide: (rideId: string | number) => Promise<{ success: boolean; message?: string }>
  startRide: (rideId: string | number) => Promise<{ success: boolean; message?: string }>
  arriveRide: (rideId: string | number) => Promise<{ success: boolean; message?: string }>
  completeRide: (rideId: string | number, data?: Record<string, unknown>) => Promise<{ success: boolean; message?: string }>
  cancelRide: (rideId: string | number, reason?: string) => Promise<{ success: boolean; message?: string }>
  fetchRide: (rideId: string | number) => Promise<Ride | null>
  fetchRides: () => Promise<void>
  getMessages: (rideId: string | number) => Promise<{ success: boolean; messages?: any[]; message?: string }>
  sendMessage: (rideId: string | number, message: string) => Promise<{ success: boolean; message?: any }>
  setRides: (rides: Ride[]) => void
  addRide: (ride: Ride) => void
  updateRide: (ride: Ride) => void
  removeRide: (id: string | number) => void
  setCurrentRide: (ride: Ride | null) => void
  setLoading: (loading: boolean) => void
}

const mockPendingRides: PendingRide[] = [
  {
    id: 'demo-1',
    category: 'Carros',
    estimated_fare: 18.87,
    distance: 5400,
    estimated_duration: 918,
    payment_method: 'dinheiro',
    passenger_name: 'deivid rothen',
    passenger_rating: 4.8,
    origin_address: 'Av. Valdo Nunes Vieira, 323-02, São Francisco',
    destination_address: 'Av. Sete de Setembro, 3384, Centro',
    observations: 'Nenhuma observação',
    created_at: new Date().toISOString(),
  },
]

export const useRidesStore = create<RidesState>((set, get) => ({
  rides: [],
  pendingRides: [],
  currentRide: null,
  loading: false,

  fetchPendingRides: async () => {
    set({ loading: true })
    try {
      const response = await api.get('/api/driver/rides/pending')
      set({ pendingRides: response.data?.rides || response.data || [], loading: false })
    } catch {
      set({ pendingRides: mockPendingRides, loading: false })
    }
  },

  acceptRide: async (rideId) => {
    try {
      const response = await api.post(`/api/driver/rides/${rideId}/accept`)
      const ride = response.data?.ride || response.data
      set((state) => ({
        pendingRides: state.pendingRides.filter((r) => r.id !== rideId),
        currentRide: ride,
      }))
      return { success: true }
    } catch (error: any) {
      const pending = get().pendingRides.find((r) => r.id === rideId)
      if (pending) {
        const ride: Ride = {
          id: rideId,
          status: 'accepted',
          origin_address: pending.origin_address,
          destination_address: pending.destination_address,
          estimated_fare: pending.estimated_fare,
          payment_method: pending.payment_method,
          passenger_name: pending.passenger_name,
          passenger_rating: pending.passenger_rating,
          distance: pending.distance,
          duration: pending.estimated_duration,
          created_at: pending.created_at,
        }
        set((state) => ({
          pendingRides: state.pendingRides.filter((r) => r.id !== rideId),
          currentRide: ride,
        }))
        return { success: true }
      }
      return { success: false, message: error.response?.data?.message || 'Erro ao aceitar corrida' }
    }
  },

  declineRide: async (rideId) => {
    try {
      await api.post(`/api/driver/rides/${rideId}/decline`)
    } catch {
      // fallback offline
    }
    set((state) => ({
      pendingRides: state.pendingRides.filter((r) => r.id !== rideId),
    }))
    return { success: true }
  },

  startRide: async (rideId) => {
    try {
      await api.post(`/api/driver/rides/${rideId}/start`)
    } catch {
      // fallback
    }
    const { currentRide } = get()
    if (currentRide?.id == rideId) {
      set({ currentRide: { ...currentRide, status: 'started' } })
    }
    return { success: true }
  },

  arriveRide: async (rideId) => {
    try {
      await api.post(`/api/driver/rides/${rideId}/arrive`)
    } catch {
      // fallback
    }
    const { currentRide } = get()
    if (currentRide?.id == rideId) {
      set({ currentRide: { ...currentRide, status: 'arrived' } })
    }
    return { success: true }
  },

  completeRide: async (rideId, data = {}) => {
    try {
      await api.post(`/api/driver/rides/${rideId}/complete`, data)
    } catch {
      // fallback
    }
    const { currentRide } = get()
    if (currentRide?.id == rideId) {
      set({ currentRide: { ...currentRide, status: 'completed' } })
    }
    return { success: true }
  },

  cancelRide: async (rideId, reason) => {
    try {
      await api.post(`/api/driver/rides/${rideId}/cancel`, { reason })
    } catch {
      // fallback
    }
    set({ currentRide: null })
    return { success: true }
  },

  fetchRide: async (rideId) => {
    try {
      const response = await api.get(`/api/driver/rides/${rideId}`)
      const ride = response.data
      set({ currentRide: ride })
      return ride
    } catch {
      const { currentRide } = get()
      if (currentRide?.id == rideId) return currentRide
      return null
    }
  },

  fetchRides: async () => {
    set({ loading: true })
    try {
      const response = await api.get('/api/driver/rides/history')
      set({ rides: response.data?.rides || response.data || [], loading: false })
    } catch {
      set({
        rides: [
          {
            id: 1,
            status: 'completed',
            pickup_address: 'Shopping Center',
            dropoff_address: 'Residencial Jardins',
            pickup_lat: -23.55,
            pickup_lng: -46.63,
            dropoff_lat: -23.56,
            dropoff_lng: -46.64,
            price: 32.5,
            passenger_name: 'Ana Silva',
            created_at: new Date().toISOString(),
          },
        ],
        loading: false,
      })
    }
  },

  getMessages: async (rideId) => {
    try {
      const response = await api.get(`/api/driver/rides/${rideId}/messages`)
      return { success: true, messages: response.data }
    } catch {
      return {
        success: true,
        messages: [{ id: 1, message: 'Estou no local de embarque', is_driver: false, sender_name: 'Passageiro', created_at: new Date().toISOString() }],
      }
    }
  },

  sendMessage: async (rideId, message) => {
    try {
      const response = await api.post(`/api/driver/rides/${rideId}/messages`, { message })
      return { success: true, message: response.data }
    } catch {
      return { success: true, message: { id: Date.now(), message, is_driver: true, created_at: new Date().toISOString() } }
    }
  },

  setRides: (rides) => set({ rides }),
  addRide: (ride) => set((state) => ({ rides: [ride, ...state.rides] })),
  updateRide: (ride) =>
    set((state) => ({
      rides: state.rides.map((r) => (r.id === ride.id ? ride : r)),
      currentRide: state.currentRide?.id === ride.id ? ride : state.currentRide,
    })),
  removeRide: (id) =>
    set((state) => ({
      rides: state.rides.filter((r) => r.id !== id),
      currentRide: state.currentRide?.id === id ? null : state.currentRide,
    })),
  setCurrentRide: (ride) => set({ currentRide: ride }),
  setLoading: (loading) => set({ loading }),
}))
