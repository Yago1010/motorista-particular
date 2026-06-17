import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@/services/api'
import socketService from '@/services/socket'

export interface RiderUser {
  id: number
  first_name: string
  last_name: string
  email: string
  phone?: string
  avatar?: string
  wallet_balance?: number
}

interface AuthState {
  user: RiderUser | null
  token: string | null
  loading: boolean
  loadingMessage: string
  isAuthenticated: boolean
  
  initAuth: () => Promise<void>
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>
  register: (data: any) => Promise<{ success: boolean; message?: string }>
  sendOtp: (phone: string) => Promise<{ success: boolean; message?: string }>
  verifyOtp: (phone: string, otp: string) => Promise<{ success: boolean; message?: string }>
  verifyOtpAndRegister: (phone: string, otp: string, userData: any) => Promise<{ success: boolean; message?: string }>
  logout: () => Promise<void>
  updateLocation: (lat: number, lng: number) => Promise<void>
  connectSocket: () => Promise<void>
}

// Socket handlers
const handleRideAccepted = (data: any) => console.log('Ride accepted:', data)
const handleDriverArrived = (data: any) => console.log('Driver arrived:', data)
const handleRideStarted = (data: any) => console.log('Ride started:', data)
const handleRideCompleted = (data: any) => console.log('Ride completed:', data)
const handleRideCancelled = (data: any) => console.log('Ride cancelled:', data)
const handleNewMessage = (data: any) => console.log('New message:', data)
const handleDriverLocation = (data: any) => console.log('Driver location:', data)

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,
      loadingMessage: '',
      isAuthenticated: false,

      initAuth: async () => {
        const savedToken = localStorage.getItem('rider_token')
        const savedUser = localStorage.getItem('rider_user')

        if (savedToken && savedUser) {
          try {
            const userData = JSON.parse(savedUser)
            set({ token: savedToken, user: userData, isAuthenticated: true })
            api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`
            await get().connectSocket()
          } catch (error) {
            localStorage.removeItem('rider_token')
            localStorage.removeItem('rider_user')
            set({ token: null, user: null, isAuthenticated: false })
          }
        }
      },

      login: async (email, password) => {
        set({ loading: true, loadingMessage: 'Entrando...' })
        try {
          const response = await api.post('/api/rider/login', { email, password })
          const { token: newToken, user: userData } = response.data

          set({
            token: newToken,
            user: userData,
            isAuthenticated: true,
            loading: false,
          })
          localStorage.setItem('rider_token', newToken)
          localStorage.setItem('rider_user', JSON.stringify(userData))
          api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`

          await get().connectSocket()
          return { success: true }
        } catch (error: any) {
          set({ loading: false })
          return { success: false, message: error.response?.data?.message || 'Erro ao entrar' }
        }
      },

      register: async (data) => {
        set({ loading: true, loadingMessage: 'Criando conta...' })
        try {
          const response = await api.post('/api/rider/register', data)
          const { token: newToken, user: userData } = response.data

          set({
            token: newToken,
            user: userData,
            isAuthenticated: true,
            loading: false,
          })
          localStorage.setItem('rider_token', newToken)
          localStorage.setItem('rider_user', JSON.stringify(userData))
          api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`

          await get().connectSocket()
          return { success: true }
        } catch (error: any) {
          set({ loading: false })
          return { success: false, message: error.response?.data?.message || 'Erro ao registrar' }
        }
      },

      sendOtp: async (phone) => {
        try {
          const response = await api.post('/api/rider/send-otp', { phone })
          return { success: true, message: response.data.message }
        } catch (error: any) {
          return { success: false, message: error.response?.data?.message || 'Erro ao enviar código' }
        }
      },

      verifyOtp: async (phone, otp) => {
        try {
          const response = await api.post('/api/rider/verify-otp', { phone, otp })
          const { token: newToken, user: userData } = response.data

          set({
            token: newToken,
            user: userData,
            isAuthenticated: true,
          })
          localStorage.setItem('rider_token', newToken)
          localStorage.setItem('rider_user', JSON.stringify(userData))
          api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`

          await get().connectSocket()
          return { success: true }
        } catch (error: any) {
          return { success: false, message: error.response?.data?.message || 'Código inválido' }
        }
      },

      verifyOtpAndRegister: async (phone, otp, userData) => {
        try {
          const response = await api.post('/api/rider/verify-otp-register', { phone, otp, ...userData })
          const { token: newToken, user: userDataResponse } = response.data

          set({
            token: newToken,
            user: userDataResponse,
            isAuthenticated: true,
          })
          localStorage.setItem('rider_token', newToken)
          localStorage.setItem('rider_user', JSON.stringify(userDataResponse))
          api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`

          await get().connectSocket()
          return { success: true }
        } catch (error: any) {
          return { success: false, message: error.response?.data?.message || 'Erro ao verificar código' }
        }
      },

      logout: async () => {
        set({ loading: true, loadingMessage: 'Saindo...' })
        try {
          await api.post('/api/rider/logout')
        } catch (error) {
          console.error('Logout error:', error)
        } finally {
          localStorage.removeItem('rider_token')
          localStorage.removeItem('rider_user')
          delete api.defaults.headers.common['Authorization']
          socketService.disconnect()
          set({
            token: null,
            user: null,
            isAuthenticated: false,
            loading: false,
          })
        }
      },

      connectSocket: async () => {
        const token = get().token
        if (!token) return

        try {
          await socketService.connect(token)
          socketService.on('ride:accepted', handleRideAccepted)
          socketService.on('ride:driver_arrived', handleDriverArrived)
          socketService.on('ride:started', handleRideStarted)
          socketService.on('ride:completed', handleRideCompleted)
          socketService.on('ride:cancelled', handleRideCancelled)
          socketService.on('message:new', handleNewMessage)
          socketService.on('driver:location', handleDriverLocation)
        } catch (error) {
          console.error('Socket connection error:', error)
        }
      },

      updateLocation: async (lat, lng) => {
        try {
          await api.post('/api/rider/location', { latitude: lat, longitude: lng })
        } catch (error) {
          console.error('Update location error:', error)
        }
      },
    }),
    {
      name: 'rider-auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
)
