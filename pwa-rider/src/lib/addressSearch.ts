import { hasGoogleMapsKey, loadGoogleMaps } from './googleMapsLoader'
import { searchNominatim } from './nominatimSearch'

export type AddressPrediction = {
  id: string
  placeId?: string
  primaryText: string
  secondaryText: string
  lat?: number
  lng?: number
  distanceKm?: number
}

async function searchGooglePredictions(
  input: string,
  origin: { lat: number; lng: number },
  sessionToken: google.maps.places.AutocompleteSessionToken,
): Promise<AddressPrediction[]> {
  await loadGoogleMaps()
  const ac = new google.maps.places.AutocompleteService()
  const bias = new google.maps.Circle({
    center: { lat: origin.lat, lng: origin.lng },
    radius: 85_000,
  })
  const preds = await new Promise<google.maps.places.AutocompletePrediction[]>((resolve, reject) => {
    ac.getPlacePredictions(
      {
        input,
        sessionToken,
        componentRestrictions: { country: ['br', 'pt'] },
        locationBias: bias,
      },
      (res, status) => {
        if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) resolve([])
        else if (status !== google.maps.places.PlacesServiceStatus.OK || !res) {
          reject(new Error(`Places: ${String(status)}`))
        } else resolve(res)
      },
    )
  })

  return preds.slice(0, 10).map((p) => ({
    id: p.place_id,
    placeId: p.place_id,
    primaryText: p.structured_formatting.main_text,
    secondaryText: p.structured_formatting.secondary_text ?? '',
  }))
}

export async function searchAddresses(
  input: string,
  origin: { lat: number; lng: number },
  sessionToken: google.maps.places.AutocompleteSessionToken | null,
): Promise<AddressPrediction[]> {
  const q = input.trim()
  if (q.length < 2) return []
  if (hasGoogleMapsKey()) {
    try {
      await loadGoogleMaps()
      const token = sessionToken ?? new google.maps.places.AutocompleteSessionToken()
      return await searchGooglePredictions(q, origin, token)
    } catch {
      /* OSM abaixo */
    }
  }
  return searchNominatim(q, origin).then((rows) =>
    rows.map((r) => ({
      id: r.id,
      primaryText: r.primaryText,
      secondaryText: r.secondaryText,
      lat: r.lat,
      lng: r.lng,
      distanceKm: r.distanceKm,
    })),
  )
}

export async function createPlacesSessionToken(): Promise<google.maps.places.AutocompleteSessionToken> {
  await loadGoogleMaps()
  return new google.maps.places.AutocompleteSessionToken()
}

/** Coordenadas + etiqueta após escolha (uma chamada getDetails no Google). */
export async function resolvePlaceSelection(
  pred: AddressPrediction,
  sessionToken: google.maps.places.AutocompleteSessionToken | null,
): Promise<{ lat: number; lng: number; primaryText: string; secondaryText: string }> {
  if (pred.lat != null && pred.lng != null) {
    return {
      lat: pred.lat,
      lng: pred.lng,
      primaryText: pred.primaryText,
      secondaryText: pred.secondaryText,
    }
  }
  if (!pred.placeId) {
    throw new Error('Endereço sem coordenadas.')
  }
  const placeId = pred.placeId
  await loadGoogleMaps()
  const dummy = document.createElement('div')
  const places = new google.maps.places.PlacesService(dummy)
  const place = await new Promise<google.maps.places.PlaceResult | null>((resolve) => {
    places.getDetails(
      {
        placeId,
        fields: ['geometry', 'formatted_address', 'name'],
        sessionToken: sessionToken ?? undefined,
      },
      (p, st) => {
        if (st === google.maps.places.PlacesServiceStatus.OK && p?.geometry?.location) resolve(p)
        else resolve(null)
      },
    )
  })
  if (!place?.geometry?.location) {
    throw new Error('Não foi possível obter o local no mapa.')
  }
  const loc = place.geometry.location
  return {
    lat: loc.lat(),
    lng: loc.lng(),
    primaryText: pred.primaryText,
    secondaryText: place.formatted_address ?? pred.secondaryText,
  }
}
