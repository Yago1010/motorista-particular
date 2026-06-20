import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'

export const driverRideKeys = {
  pending: ['driver', 'rides', 'pending'] as const,
  detail: (id: string | number) => ['driver', 'rides', id] as const,
  history: ['driver', 'rides', 'history'] as const,
}

export function usePendingRidesQuery(enabled = true) {
  const isOnline = useAuthStore((s) => s.isOnline)
  const isPaused = useAuthStore((s) => s.isPaused)
  return useQuery({
    queryKey: driverRideKeys.pending,
    queryFn: async () => {
      const { data } = await api.get('driver/rides/pending')
      return data.rides || []
    },
    enabled: enabled && isOnline && !isPaused,
    refetchInterval: 5000,
  })
}

export function useDriverRideQuery(rideId?: string | number) {
  return useQuery({
    queryKey: driverRideKeys.detail(rideId || ''),
    queryFn: async () => {
      const { data } = await api.get(`driver/rides/${rideId}`)
      return data.ride
    },
    enabled: !!rideId,
    refetchInterval: 4000,
  })
}

export function useDriverHistoryQuery() {
  return useQuery({
    queryKey: driverRideKeys.history,
    queryFn: async () => {
      const { data } = await api.get('driver/rides/history')
      return data.rides || []
    },
  })
}

export function useDriverWalletQuery() {
  return useQuery({
    queryKey: ['driver', 'wallet'],
    queryFn: async () => {
      const { data } = await api.get('driver/wallet')
      return data
    },
    staleTime: 30_000,
  })
}

export function useDriverEarningsQuery() {
  return useQuery({
    queryKey: ['driver', 'earnings'],
    queryFn: async () => {
      const { data } = await api.get('driver/earnings/summary')
      return data
    },
  })
}

export function useWithdrawMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { amount: number; method: string; pix_key?: string }) => {
      const { data } = await api.post('driver/wallet/withdraw', payload)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['driver', 'wallet'] })
    },
  })
}
