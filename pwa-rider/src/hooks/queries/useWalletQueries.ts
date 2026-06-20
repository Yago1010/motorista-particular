import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'
import { normalizeWalletTransaction } from '@/utils/walletTx'
import { useAuthStore } from '@/stores/auth'

export const walletKeys = {
  all: ['wallet'] as const,
  transactions: ['wallet', 'transactions'] as const,
}

export async function fetchWallet() {
  const { data } = await api.get('rider/wallet')
  return {
    balance: Number(data.balance) || 0,
    pending: Number(data.pending) || 0,
    paymentMethods: data.payment_methods || [],
  }
}

export async function fetchWalletTransactions() {
  const { data } = await api.get('rider/wallet/transactions')
  return (data.transactions || []).map(normalizeWalletTransaction)
}

export function useWalletQuery() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const authReady = useAuthStore((s) => s.authReady)
  return useQuery({
    queryKey: walletKeys.all,
    queryFn: fetchWallet,
    staleTime: 30_000,
    enabled: authReady && isAuthenticated,
  })
}

export function useWalletTransactionsQuery() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const authReady = useAuthStore((s) => s.authReady)
  return useQuery({
    queryKey: walletKeys.transactions,
    queryFn: fetchWalletTransactions,
    staleTime: 30_000,
    enabled: authReady && isAuthenticated,
  })
}

export function useAddFundsMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (amount: number) => {
      const { data } = await api.post('rider/wallet/add-funds', { amount, method: 'pix' })
      return data as { success: boolean; pix_code?: string; balance?: number }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: walletKeys.all })
      qc.invalidateQueries({ queryKey: walletKeys.transactions })
    },
  })
}
