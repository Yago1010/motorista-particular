interface Place {
  place_id: number
  licence: string
  osm_type: string
  osm_id: number
  lat: string
  lon: string
  display_name: string
  address: {
    house_number?: string
    road?: string
    neighbourhood?: string
    city?: string
    state?: string
    postcode?: string
    country?: string
  }
}

interface RouteResult {
  success: boolean
  distance?: number
  duration?: number
  geometry?: any
  steps?: any[]
  message?: string
}

interface PlacesResponse {
  success: boolean
  places?: Place[]
  address?: any
  message?: string
}

class PlacesService {
  async searchAddresses(query: string, limit = 5): Promise<PlacesResponse> {
    if (!query || query.length < 3) return { success: true, places: [] }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=${limit}&accept-language=pt-BR&countrycodes=br`,
        {
          headers: {
            'User-Agent': 'UberClone2025/1.0',
          },
        }
      )
      const data: Place[] = await response.json()
      return { success: true, places: data }
    } catch (error) {
      console.error('Search addresses error:', error)
      return { success: false, places: [] }
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<PlacesResponse> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=pt-BR`,
        {
          headers: {
            'User-Agent': 'UberClone2025/1.0',
          },
        }
      )
      const data = await response.json()
      return { success: true, address: data }
    } catch (error) {
      console.error('Reverse geocode error:', error)
      return { success: false, address: null }
    }
  }

  async calculateRoute(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number
  ): Promise<RouteResult> {
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson&steps=true`
      )
      const data = await response.json()

      if (data.routes && data.routes[0]) {
        const route = data.routes[0]
        return {
          success: true,
          distance: route.distance,
          duration: route.duration,
          geometry: route.geometry,
          steps: route.legs[0]?.steps || [],
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