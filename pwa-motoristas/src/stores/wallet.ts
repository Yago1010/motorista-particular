import { create } from 'zustand';

export interface Transaction {
  id: number;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

export interface WalletData {
  balance: number;
  pending_balance: number;
  transactions: Transaction[];
}

interface WalletState {
  wallet: WalletData | null;
  loading: boolean;
  
  setWallet: (wallet: WalletData) => void;
  setBalance: (balance: number) => void;
  addTransaction: (transaction: Transaction) => void;
  setLoading: (loading: boolean) => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  wallet: null,
  loading: false,

  setWallet: (wallet) => set({ wallet }),
  setBalance: (balance) => set((state) => ({
    wallet: state.wallet ? { ...state.wallet, balance } : null,
  })),
  addTransaction: (transaction) => set((state) => ({
    wallet: state.wallet ? { ...state.wallet, transactions: [transaction, ...state.wallet.transactions] } : null,
  })),
  setLoading: (loading) => set({ loading }),
}));