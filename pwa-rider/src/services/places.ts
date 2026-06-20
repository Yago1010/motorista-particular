import api from './api'

export interface PlaceResult {
  lat: number
  lng: number
  address: string
  distance_m?: number
}

export interface RouteResult {
  success: boolean
  distance?: number
  duration?: number
  geometry?: GeoJSON.LineString
  steps?: unknown[]
  message?: string
}

class PlacesService {
  async searchAddresses(query: string, near?: { lat: number; lng: number }, limit = 8) {
    if (!query || query.length < 2) return { success: true, places: [] as PlaceResult[] }

    try {
      const params: Record<string, string | number> = { q: query, limit }
      if (near) {
        params.lat = near.lat
        params.lng = near.lng
        params.radius_km = 35
      }
      const response = await api.get('/places/search', { params })
      return { success: true, places: (response.data.places || []) as PlaceResult[] }
    } catch (error) {
      console.error('Search addresses error:', error)
      return { success: false, places: [] as PlaceResult[] }
    }
  }

  async reverseGeocode(lat: number, lng: number) {
    try {
      const response = await api.get('/places/reverse', { params: { lat, lng } })
      return { success: true, address: response.data.address }
    } catch (error) {
      console.error('Reverse geocode error:', error)
      return { success: false, address: null }
    }
  }

  async calculateRoute(originLat: number, originLng: number, destLat: number, destLng: number): Promise<RouteResult> {
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson&steps=true`
      )
      const data = await response.json()

      if (data.routes?.[0]) {
        const route = data.routes[0]
        return {
          success: true,
          distance: route.distance,
          duration: route.duration,
          geometry: route.geometry,
          steps: route.legs?.[0]?.steps || [],
        }
      }
      return { success: false, message: 'Rota não encontrada' }
    } catch (error) {
      console.error('Calculate route error:', error)
      return { success: false, message: 'Erro ao calcular rota' }
    }
  }
}

export default new PlacesService()
