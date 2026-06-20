import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@/services/api'
import { clearRiderSession, syncRiderApiToken } from '@/utils/authSession'
import { resetRiderAppSession } from '@/utils/resetAppSession'
import { useRidesStore } from '@/stores/rides'

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
  authReady: boolean

  initAuth: () => Promise<void>
  forceLogout: () => void
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>
  register: (data: any) => Promise<{ success: boolean; message?: string }>
  sendOtp: (phone: string) => Promise<{ success: boolean; message?: string }>
  verifyOtp: (phone: string, otp: string) => Promise<{ success: boolean; message?: string }>
  verifyOtpAndRegister: (phone: string, otp: string, userData: any) => Promise<{ success: boolean; message?: string }>
  logout: () => Promise<void>
  updateLocation: (lat: number, lng: number) => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,
      loadingMessage: '',
      isAuthenticated: false,
      authReady: false,

      initAuth: async () => {
        const savedToken = localStorage.getItem('rider_token')
        const savedUser = localStorage.getItem('rider_user')

        if (savedToken && savedUser) {
          try {
            const userData = JSON.parse(savedUser)
            syncRiderApiToken(savedToken)
            set({ token: savedToken, user: userData, isAuthenticated: true })
          } catch {
            resetRiderAppSession()
            useRidesStore.getState().clearCurrentRide()
            set({ token: null, user: null, isAuthenticated: false })
          }
        }
      },

      forceLogout: () => {
        resetRiderAppSession()
        useRidesStore.getState().clearCurrentRide()
        set({ token: null, user: null, isAuthenticated: false, loading: false })
      },

      login: async (email, password) => {
        set({ loading: true, loadingMessage: 'Entrando...' })
        try {
          const response = await api.post('rider/login', { email, password })
          const { token: newToken, user: userData } = response.data

          set({
            token: newToken,
            user: userData,
            isAuthenticated: true,
            loading: false,
          })
          localStorage.setItem('rider_token', newToken)
          localStorage.setItem('rider_user', JSON.stringify(userData))
          syncRiderApiToken(newToken)

          return { success: true }
        } catch (error: any) {
          set({ loading: false })
          const { isDemoRiderCredentials, buildDemoRiderSession } = await import('@/config/demoUsers')
          if (isDemoRiderCredentials(email, password)) {
            const session = buildDemoRiderSession()
            localStorage.setItem('chama_demo', '1')
            set({ token: session.token, user: session.user, isAuthenticated: true })
            localStorage.setItem('rider_token', session.token)
            localStorage.setItem('rider_user', JSON.stringify(session.user))
            syncRiderApiToken(session.token)
            return { success: true }
          }
          return { success: false, message: error.response?.data?.message || 'Erro ao entrar' }
        }
      },

      register: async (data) => {
        set({ loading: true, loadingMessage: 'Criando conta...' })
        try {
          const response = await api.post('rider/register', data)
          const { token: newToken, user: userData } = response.data

          set({
            token: newToken,
            user: userData,
            isAuthenticated: true,
            loading: false,
          })
          localStorage.setItem('rider_token', newToken)
          localStorage.setItem('rider_user', JSON.stringify(userData))
          syncRiderApiToken(newToken)

          return { success: true }
        } catch (error: any) {
          set({ loading: false })
          return { success: false, message: error.response?.data?.message || 'Erro ao registrar' }
        }
      },

      sendOtp: async (phone) => {
        try {
          const response = await api.post('rider/send-otp', { phone })
          return { success: true, message: response.data.message }
        } catch (error: any) {
          return { success: false, message: error.response?.data?.message || 'Erro ao enviar código' }
        }
      },

      verifyOtp: async (phone, otp) => {
        try {
          const response = await api.post('rider/verify-otp', { phone, otp })
          const { token: newToken, user: userData } = response.data

          set({
            token: newToken,
            user: userData,
            isAuthenticated: true,
          })
          localStorage.setItem('rider_token', newToken)
          localStorage.setItem('rider_user', JSON.stringify(userData))
          syncRiderApiToken(newToken)

          return { success: true }
        } catch (error: any) {
          return { success: false, message: error.response?.data?.message || 'Código inválido' }
        }
      },

      verifyOtpAndRegister: async (phone, otp, userData) => {
        try {
          const response = await api.post('rider/verify-otp-register', { phone, otp, ...userData })
          const { token: newToken, user: userDataResponse } = response.data

          set({
            token: newToken,
            user: userDataResponse,
            isAuthenticated: true,
          })
          localStorage.setItem('rider_token', newToken)
          localStorage.setItem('rider_user', JSON.stringify(userDataResponse))
          syncRiderApiToken(newToken)

          return { success: true }
        } catch (error: any) {
          return { success: false, message: error.response?.data?.message || 'Erro ao verificar código' }
        }
      },

      logout: async () => {
        set({ loading: true, loadingMessage: 'Saindo...' })
        try {
          await api.post('rider/logout')
        } catch (error) {
          console.error('Logout error:', error)
        } finally {
          resetRiderAppSession()
          useRidesStore.getState().clearCurrentRide()
          set({
            token: null,
            user: null,
            isAuthenticated: false,
            loading: false,
          })
        }
      },

      updateLocation: async (lat, lng) => {
        try {
          await api.post('rider/location', { latitude: lat, longitude: lng })
        } catch (error) {
          console.error('Update location error:', error)
        }
      },
    }),
    {
      name: 'rider-auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) syncRiderApiToken(state.token)
      },
    }
  )
)

useAuthStore.persist.onFinishHydration(() => {
  useAuthStore.setState({ authReady: true })
})
