export type GeoPoint = { lat: number; lng: number }

export type DestinationSearchNavState = {
  origin: GeoPoint
  pickupLabel: string
}

export type RidePaymentIconKey = 'pix' | 'cash' | 'terminal' | 'card'

export type RidePaymentSelection = {
  id: RidePaymentIconKey
  label: string
  iconKey: RidePaymentIconKey
}

export type RideConfirmNavState = DestinationSearchNavState & {
  dest: GeoPoint
  destPrimary: string
  destSecondary: string
  /** Método escolhido na folha de confirmação (persistido ao voltar das sub-rotas). */
  payment?: RidePaymentSelection
}
