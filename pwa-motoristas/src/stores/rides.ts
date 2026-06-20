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
  status: 'pending' | 'accepted' | 'pickup_arrived' | 'started' | 'arrived' | 'in_progress' | 'destination_arrived' | 'completed' | 'cancelled'
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
  arriveAtPickup: (rideId: string | number) => Promise<{ success: boolean; message?: string }>
  arriveAtDestination: (rideId: string | number) => Promise<{ success: boolean; message?: string }>
  ratePassenger: (rideId: string | number, rating: number, comment?: string) => Promise<{ success: boolean; message?: string }>
  markMessagesAsRead: (rideId: string | number) => Promise<{ success: boolean }>
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
    try {
      const response = await api.get('driver/rides/pending')
      set({ pendingRides: response.data?.rides || [] })
    } catch {
      set({ pendingRides: [] })
    }
  },

  acceptRide: async (rideId) => {
    try {
      const response = await api.post(`driver/rides/${rideId}/accept`)
      const ride = response.data?.ride || response.data
      set((state) => ({
        pendingRides: state.pendingRides.filter((r) => r.id !== rideId),
        currentRide: ride,
      }))
      return { success: true }
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Erro ao aceitar corrida' }
    }
  },

  declineRide: async (rideId) => {
    try {
      await api.post(`driver/rides/${rideId}/decline`)
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
      const response = await api.post(`driver/rides/${rideId}/start`)
      const ride = response.data?.ride
      const { currentRide } = get()
      if (currentRide?.id == rideId) {
        set({ currentRide: ride || { ...currentRide, status: 'in_progress' } })
      }
      return { success: true }
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Erro ao iniciar corrida' }
    }
  },

  arriveRide: async (rideId) => {
    return get().arriveAtPickup(rideId)
  },

  arriveAtPickup: async (rideId) => {
    try {
      const response = await api.post(`driver/rides/${rideId}/arrive`)
      const ride = response.data?.ride
      const { currentRide } = get()
      if (currentRide?.id == rideId) {
        set({ currentRide: ride || { ...currentRide, status: 'pickup_arrived' } })
      }
      return { success: true }
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Erro ao registrar chegada' }
    }
  },

  arriveAtDestination: async (rideId) => {
    try {
      const response = await api.post(`driver/rides/${rideId}/arrive-destination`)
      const ride = response.data?.ride
      const { currentRide } = get()
      if (currentRide?.id == rideId) {
        set({ currentRide: ride || { ...currentRide, status: 'destination_arrived' } })
      }
      return { success: true }
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Erro ao registrar destino' }
    }
  },

  completeRide: async (rideId, data = {}) => {
    try {
      const response = await api.post(`driver/rides/${rideId}/complete`, data)
      const ride = response.data?.ride
      const { currentRide } = get()
      if (currentRide?.id == rideId) {
        set({ currentRide: ride || { ...currentRide, status: 'completed' } })
      }
      return { success: true }
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Erro ao finalizar corrida' }
    }
  },

  cancelRide: async (rideId, reason) => {
    try {
      await api.post(`driver/rides/${rideId}/cancel`, { reason })
    } catch {
      // fallback
    }
    set({ currentRide: null })
    return { success: true }
  },

  fetchRide: async (rideId) => {
    try {
      const response = await api.get(`driver/rides/${rideId}`)
      const ride = response.data?.ride || response.data
      set({ currentRide: ride })
      return ride
    } catch {
      return null
    }
  },

  fetchRides: async () => {
    set({ loading: true })
    try {
      const response = await api.get('driver/rides/history')
      set({ rides: response.data?.rides || [], loading: false })
    } catch {
      set({ rides: [], loading: false })
    }
  },

  ratePassenger: async (rideId, rating, comment) => {
    try {
      await api.post(`driver/rides/${rideId}/rate-passenger`, { rating, comment })
    } catch {
      // fallback
    }
    return { success: true }
  },

  markMessagesAsRead: async (rideId) => {
    try {
      await api.post(`driver/rides/${rideId}/messages/read`)
      return { success: true }
    } catch {
      return { success: true }
    }
  },

  getMessages: async (rideId) => {
    try {
      const response = await api.get(`driver/rides/${rideId}/messages`)
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
      const response = await api.post(`driver/rides/${rideId}/messages`, { message })
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
