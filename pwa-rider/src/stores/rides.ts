import { create } from 'zustand'
import api from '@/services/api'

export interface Ride {
  id: string | number
  status: string
  pickup_address: string
  destination_address: string
  fare: number
  driver?: {
    first_name: string
    last_name: string
    avatar?: string
    vehicle_model?: string
    vehicle_plate?: string
    vehicle_color?: string
    rating?: number
  }
}

interface RidesState {
  currentRide: Ride | null
  rideHistory: any[]
  loading: boolean
  searchingDrivers: boolean
  nearbyDrivers: any[]
  rideMessages: any[]
  hasActiveRide: boolean

  requestRide: (data: any) => Promise<{ success: boolean; ride?: any; message?: string }>
  fetchRideHistory: (params?: any) => Promise<void>
  cancelRide: (rideId: string | number, reason?: string) => Promise<{ success: boolean; message?: string }>
  rateDriver: (rideId: string | number, rating: number, comment?: string) => Promise<{ success: boolean; message?: string }>
  setCurrentRide: (ride: any) => void
  clearCurrentRide: () => void
  updateRideStatus: (status: string, data?: any) => void
  setNearbyDrivers: (drivers: any[]) => void
  sendMessage: (rideId: string | number, message: string) => Promise<{ success: boolean; message?: any }>
  getMessages: (rideId: string | number) => Promise<{ success: boolean; messages?: any[]; message?: string }>
  markMessagesAsRead: (rideId: string | number) => Promise<{ success: boolean }>
  estimateFare: (originLat: number, originLng: number, destLat: number, destLng: number, category: string) => Promise<{ success: boolean; estimate?: any; message?: string }>
  searchAddresses: (query: string) => Promise<{ success: boolean; places: any[] }>
  getNearbyDrivers: (lat: number, lng: number, category: string) => Promise<{ success: boolean; drivers: any[] }>
}

export const useRidesStore = create<RidesState>((set, get) => ({
  currentRide: null,
  rideHistory: [],
  loading: false,
  searchingDrivers: false,
  nearbyDrivers: [],
  rideMessages: [],
  hasActiveRide: false,

  requestRide: async (data) => {
    set({ loading: true })
    try {
      const response = await api.post('/api/rider/rides/request', data)
      const ride = response.data.ride
      set({ currentRide: ride, searchingDrivers: true, hasActiveRide: true, loading: false })
      return { success: true, ride }
    } catch (error: any) {
      set({ loading: false })
      return { success: false, message: error.response?.data?.message || 'Erro ao solicitar corrida' }
    }
  },

  fetchRideHistory: async (params = {}) => {
    set({ loading: true })
    try {
      const response = await api.get('/api/rider/rides/history', { params })
      set({ rideHistory: response.data, loading: false })
    } catch (error) {
      console.error('Fetch ride history error:', error)
      set({ loading: false })
    }
  },

  cancelRide: async (rideId, reason) => {
    try {
      await api.post(`/api/rider/rides/${rideId}/cancel`, { reason })
      set({ currentRide: null, searchingDrivers: false, hasActiveRide: false })
      return { success: true }
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Erro ao cancelar corrida' }
    }
  },

  rateDriver: async (rideId, rating, comment) => {
    try {
      await api.post(`/api/rider/rides/${rideId}/rate`, { rating, comment })
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
    set({ currentRide: null, searchingDrivers: false, hasActiveRide: false })
  },

  updateRideStatus: (status, data = {}) => {
    const { currentRide } = get()
    if (currentRide) {
      const updatedRide = { ...currentRide, status, ...data }
      set({ currentRide: updatedRide })

      if (['completed', 'cancelled'].includes(status)) {
        set({ searchingDrivers: false })
        setTimeout(() => {
          get().clearCurrentRide()
        }, 3000)
      }
    }
  },

  setNearbyDrivers: (drivers) => {
    set({ nearbyDrivers: drivers })
  },

  sendMessage: async (rideId, message) => {
    try {
      const response = await api.post(`/api/rider/rides/${rideId}/messages`, { message })
      return { success: true, message: response.data }
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Erro ao enviar mensagem' }
    }
  },

  getMessages: async (rideId) => {
    try {
      const response = await api.get(`/api/rider/rides/${rideId}/messages`)
      return { success: true, messages: response.data }
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Erro ao buscar mensagens' }
    }
  },

  markMessagesAsRead: async (rideId) => {
    try {
      await api.post(`/api/rider/rides/${rideId}/messages/read`)
      return { success: true }
    } catch (error) {
      return { success: false }
    }
  },

  estimateFare: async (originLat, originLng, destLat, destLng, category) => {
    try {
      const response = await api.post('/api/rides/estimate', {
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

  searchAddresses: async (query) => {
    try {
      const response = await api.get('/api/places/search', { params: { q: query } })
      return { success: true, places: response.data }
    } catch (error) {
      return { success: false, places: [] }
    }
  },

  getNearbyDrivers: async (lat, lng, category) => {
    try {
      const response = await api.get('/api/drivers/nearby', {
        params: { lat, lng, category },
      })
      return { success: true, drivers: response.data }
    } catch (error) {
      return { success: false, drivers: [] }
    }
  },
}))
