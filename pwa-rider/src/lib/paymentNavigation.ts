import type { EntregaDetailsNavState } from '../types/entregaFlow'
import type { RideConfirmNavState } from '../types/rideFlow'

export type PaymentFlowLocationState =
  | { flow: 'ride'; ride: RideConfirmNavState }
  | { flow: 'entrega'; entrega: EntregaDetailsNavState }

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object'
}

export function isLegacyRideConfirmState(raw: unknown): raw is RideConfirmNavState {
  if (!isObj(raw)) return false
  return (
    typeof raw.origin === 'object' &&
    raw.origin !== null &&
    typeof raw.dest === 'object' &&
    raw.dest !== null &&
    typeof (raw as RideConfirmNavState).destPrimary === 'string'
  )
}

export function normalizePaymentFlowState(raw: unknown): PaymentFlowLocationState | null {
  if (!isObj(raw)) return null
  if (raw.flow === 'ride' && isObj(raw.ride) && isLegacyRideConfirmState(raw.ride)) {
    return { flow: 'ride', ride: raw.ride as RideConfirmNavState }
  }
  if (raw.flow === 'entrega' && isObj(raw.entrega)) {
    const e = raw.entrega as EntregaDetailsNavState
    if (e.pickupPrimary && e.dropPrimary) return { flow: 'entrega', entrega: e }
  }
  if (isLegacyRideConfirmState(raw)) {
    return { flow: 'ride', ride: raw }
  }
  return null
}

export function paymentFlowReturnBasePath(s: PaymentFlowLocationState): '/confirmar' | '/entrega/detalhes' {
  return s.flow === 'ride' ? '/confirmar' : '/entrega/detalhes'
}
