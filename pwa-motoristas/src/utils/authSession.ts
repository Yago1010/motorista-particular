import api from '@/services/api'

export function clearDriverSession() {
  localStorage.removeItem('driver_token')
  localStorage.removeItem('driver_user')
  delete api.defaults.headers.common['Authorization']
}

export function syncDriverApiToken(token: string | null) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common['Authorization']
  }
}
