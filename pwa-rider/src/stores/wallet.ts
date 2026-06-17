import { create } from 'zustand'
import api from '@/services/api'

interface WalletState {
  balance: number
  pending: number
  totalEarned: number
  transactions: any[]
  paymentMethods: any[]
  pixKeys: any[]
  loading: boolean
  loadingTransactions: boolean

  fetchWallet: () => Promise<void>
  fetchTransactions: (params?: any) => Promise<void>
  addPaymentMethod: (data: any) => Promise<{ success: boolean; method?: any; message?: string }>
  removePaymentMethod: (methodId: string | number) => Promise<{ success: boolean; message?: string }>
  setDefaultPaymentMethod: (methodId: string | number) => Promise<{ success: boolean; message?: string }>
  fetchPixKeys: () => Promise<void>
  addPixKey: (data: any) => Promise<{ success: boolean; key?: any; message?: string }>
  removePixKey: (keyId: string | number) => Promise<{ success: boolean; message?: string }>
  setDefaultPixKey: (keyId: string | number) => Promise<{ success: boolean; message?: string }>
  addFundsViaPix: (amount: number) => Promise<{ success: boolean; pixCode?: string; pixQrCode?: string; message?: string }>
  withdrawFunds: (amount: number, pixKeyId: string | number) => Promise<{ success: boolean; withdraw?: any; message?: string }>
  payRide: (rideId: string | number, paymentMethodId: string | number) => Promise<{ success: boolean; payment?: any; message?: string }>
  confirmCashPayment: (rideId: string | number) => Promise<{ success: boolean; message?: string }>
}

export const useWalletStore = create<WalletState>((set) => ({
  balance: 0,
  pending: 0,
  totalEarned: 0,
  transactions: [],
  paymentMethods: [],
  pixKeys: [],
  loading: false,
  loadingTransactions: false,

  fetchWallet: async () => {
    try {
      const response = await api.get('/api/rider/wallet')
      set({
        balance: response.data.balance,
        pending: response.data.pending,
        totalEarned: response.data.total_earned,
        paymentMethods: response.data.payment_methods || [],
        pixKeys: response.data.pix_keys || [],
      })
    } catch (error) {
      console.error('Fetch wallet error:', error)
    }
  },

  fetchTransactions: async (params = {}) => {
    set({ loadingTransactions: true })
    try {
      const response = await api.get('/api/rider/wallet/transactions', { params })
      set({ transactions: response.data, loadingTransactions: false })
    } catch (error) {
      console.error('Fetch transactions error:', error)
      set({ loadingTransactions: false })
    }
  },

  addPaymentMethod: async (data) => {
    try {
      const response = await api.post('/api/rider/wallet/payment-methods', data)
      set((state) => ({ paymentMethods: [...state.paymentMethods, response.data] }))
      return { success: true, method: response.data }
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Erro ao adicionar cartão' }
    }
  },

  removePaymentMethod: async (methodId) => {
    try {
      await api.delete(`/api/rider/wallet/payment-methods/${methodId}`)
      set((state) => ({ paymentMethods: state.paymentMethods.filter((m) => m.id !== methodId) }))
      return { success: true }
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Erro ao remover cartão' }
    }
  },

  setDefaultPaymentMethod: async (methodId) => {
    try {
      await api.post(`/api/rider/wallet/payment-methods/${methodId}/default`)
      set((state) => ({
        paymentMethods: state.paymentMethods.map((m) => ({ ...m, is_default: m.id === methodId })),
      }))
      return { success: true }
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Erro ao definir padrão' }
    }
  },

  fetchPixKeys: async () => {
    try {
      const response = await api.get('/api/rider/wallet/pix-keys')
      set({ pixKeys: response.data })
    } catch (error) {
      console.error('Fetch pix keys error:', error)
    }
  },

  addPixKey: async (data) => {
    try {
      const response = await api.post('/api/rider/wallet/pix-keys', data)
      set((state) => ({ pixKeys: [...state.pixKeys, response.data] }))
      return { success: true, key: response.data }
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Erro ao cadastrar chave Pix' }
    }
  },

  removePixKey: async (keyId) => {
    try {
      await api.delete(`/api/rider/wallet/pix-keys/${keyId}`)
      set((state) => ({ pixKeys: state.pixKeys.filter((k) => k.id !== keyId) }))
      return { success: true }
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Erro ao remover chave Pix' }
    }
  },

  setDefaultPixKey: async (keyId) => {
    try {
      await api.post(`/api/rider/wallet/pix-keys/${keyId}/default`)
      set((state) => ({
        pixKeys: state.pixKeys.map((k) => ({ ...k, is_default: k.id === keyId })),
      }))
      return { success: true }
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Erro ao definir padrão' }
    }
  },

  addFundsViaPix: async (amount) => {
    try {
      const response = await api.post('/api/rider/wallet/add-funds', { amount, method: 'pix' })
      return { success: true, pixCode: response.data.pix_code, pixQrCode: response.data.pix_qrcode }
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Erro ao gerar Pix' }
    }
  },

  withdrawFunds: async (amount, pixKeyId) => {
    try {
      const response = await api.post('/api/rider/wallet/withdraw', { amount, pix_key_id: pixKeyId })
      return { success: true, withdraw: response.data }
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Erro ao solicitar saque' }
    }
  },

  payRide: async (rideId, paymentMethodId) => {
    try {
      const response = await api.post(`/api/rider/rides/${rideId}/pay`, { payment_method_id: paymentMethodId })
      return { success: true, payment: response.data }
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Erro ao pagar corrida' }
    }
  },

  confirmCashPayment: async (rideId) => {
    try {
      await api.post(`/api/rider/rides/${rideId}/confirm-cash-payment`)
      return { success: true }
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Erro ao confirmar pagamento' }
    }
  },
}))
