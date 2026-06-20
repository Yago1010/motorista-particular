import api from '@/services/api'

export function clearRiderSession() {
  localStorage.removeItem('rider_token')
  localStorage.removeItem('rider_user')
  delete api.defaults.headers.common['Authorization']
}

export function syncRiderApiToken(token: string | null) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common['Authorization']
  }
}
