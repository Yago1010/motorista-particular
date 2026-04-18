export type GeoPoint = { lat: number; lng: number }

export type DestinationSearchNavState = {
  origin: GeoPoint
  pickupLabel: string
}

export type RideConfirmNavState = DestinationSearchNavState & {
  dest: GeoPoint
  destPrimary: string
  destSecondary: string
}
