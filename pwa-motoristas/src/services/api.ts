import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { clearDriverSession, syncDriverApiToken } from '@/utils/authSession'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('driver_token')
    syncDriverApiToken(token)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => Promise.reject(error)
)

let handling401 = false

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && !handling401) {
      handling401 = true
      clearDriverSession()
      import('@/stores/auth').then(({ useAuthStore }) => {
        useAuthStore.getState().forceLogout()
        handling401 = false
      })
    }
    return Promise.reject(error)
  }
)

export default api