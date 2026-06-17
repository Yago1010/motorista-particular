import api from './api'

class PlacesService {
  // Search addresses using Nominatim (OpenStreetMap)
  async searchAddresses(query, limit = 5) {
    if (!query || query.length < 3) return { success: true, places: [] }
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=${limit}&accept-language=pt-BR&countrycodes=br`,
        {
          headers: {
            'User-Agent': 'UberClone2025/1.0'
          }
        }
      )
      const data = await response.json()
      return { success: true, places: data }
    } catch (error) {
      console.error('Search addresses error:', error)
      return { success: false, places: [] }
    }
  }

  // Reverse geocoding
  async reverseGeocode(lat, lng) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=pt-BR`,
        {
          headers: {
            'User-Agent': 'UberClone2025/1.0'
          }
        }
      )
      const data = await response.json()
      return { success: true, address: data }
    } catch (error) {
      console.error('Reverse geocode error:', error)
      return { success: false, address: null }
    }
  }

  // Get place details
  async getPlaceDetails(placeId) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/details?format=json&place_id=${placeId}`
      )
      const data = await response.json()
      return { success: true, details: data }
    } catch (error) {
      console.error('Place details error:', error)
      return { success: false, details: null }
    }
  }

  // Calculate route using OSRM
  async calculateRoute(originLat, originLng, destLat, destLng) {
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
          steps: route.legs[0]?.steps || []
        }
      }
      return { success: false, message: 'Rota não encontrada' }
    } catch (error) {
      console.error('Calculate route error:', error)
      return { success: false, message: 'Erro ao calcular rota' }
    }
  }

  // Get nearby places (POIs)
  async getNearbyPlaces(lat, lng, radius = 1000, categories = []) {
    try {
      const categoryFilter = categories.length > 0 ? `&category=${categories.join(',')}` : ''
      const response = await fetch(
        `https://nominatim.openstreetmap.org/nearby?format=json&lat=${lat}&lon=${lng}&radius=${radius}${categoryFilter}&limit=20`
      )
      const data = await response.json()
      return { success: true, places: data }
    } catch (error) {
      console.error('Nearby places error:', error)
      return { success: false, places: [] }
    }
  }
}

export default new PlacesService()