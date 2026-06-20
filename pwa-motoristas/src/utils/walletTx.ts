export type WalletTxDirection = 'credit' | 'debit'

const CREDIT_TYPES = new Set(['credit', 'topup', 'refund', 'ride_payment'])
const DEBIT_TYPES = new Set(['debit', 'withdraw', 'ride_debit', 'payment'])

export function walletTxDirection(type: string): WalletTxDirection {
  const key = (type || '').toLowerCase()
  if (CREDIT_TYPES.has(key)) return 'credit'
  if (DEBIT_TYPES.has(key)) return 'debit'
  return key.includes('withdraw') || key.includes('payment') ? 'debit' : 'credit'
}

export function normalizeWalletTransaction<T extends { type: string }>(tx: T) {
  return { ...tx, type: walletTxDirection(tx.type) }
}
