import type { RidePaymentSelection } from './rideFlow'

export type EntregaServiceId = 'moto' | 'car'

export type EntregaItemDetails = {
  typeId: string
  typeLabel: string
  valueBrl: string
  notes: string
}

/** Estado da confirmação de entrega (última etapa antes de pedir). */
export type EntregaDetailsNavState = {
  /** `receber`: coleta = remetente; entrega = tu. `enviar` (omisso): recolha = tu; entrega = destinatário. */
  flow?: 'enviar' | 'receber'
  pickupPrimary: string
  pickupSecondary: string
  dropPrimary: string
  dropSecondary: string
  payment?: RidePaymentSelection
  service: EntregaServiceId
  item?: EntregaItemDetails
}

/** Ponto escolhido no mapa (endereço de coleta do remetente). */
export type EntregaColetaPoint = {
  lat: number
  lng: number
  primary: string
  secondary: string
}

/** Pesquisa Places em `/entrega/busca-coleta` (coleta do remetente ou entrega ao destinatário). */
export type EntregaMapSearchPurpose = 'coleta' | 'destino'

/** Estado da pesquisa no mapa (`/entrega/busca-coleta`). */
export type EntregaColetaSearchNavState = {
  origin: { lat: number; lng: number }
  purpose: EntregaMapSearchPurpose
  /** Formulário a preservar ao escolher o ponto. */
  recipientSnapshot: EntregaRecipientNavState
}

/** Passagem da home de entrega → formulário (destinatário ou remetente). */
export type EntregaRecipientNavState = {
  mode?: 'enviar' | 'receber'
  pickupPrimary: string
  pickupSecondary: string
  /** Enviar / Receber: bias da API Places (GPS na origem). */
  originBias?: { lat: number; lng: number }
  /** Receber: ponto de coleta do remetente (mapa). */
  coleta?: EntregaColetaPoint
  /** Enviar: ponto de entrega ao destinatário (mapa). */
  destino?: EntregaColetaPoint
}
