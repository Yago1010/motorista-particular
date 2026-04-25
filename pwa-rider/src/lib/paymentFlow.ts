import type { RidePaymentSelection } from '../types/rideFlow'

export const DEFAULT_PAYMENT: RidePaymentSelection = {
  id: 'cash',
  label: 'Dinheiro',
  iconKey: 'cash',
}

/** Backend: 1 = dinheiro, 2 = pagamento eletrónico / cartão. */
export function paymentToApiMode(p: RidePaymentSelection | undefined): number {
  if (!p || p.iconKey === 'cash') return 1
  return 2
}
