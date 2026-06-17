import { create } from 'zustand';

export interface Earning {
  id: number;
  date: string;
  amount: number;
  ride_count: number;
  distance: number;
  duration: number;
}

interface EarningsState {
  earnings: Earning[];
  totalEarnings: number;
  todayEarnings: number;
  loading: boolean;
  
  setEarnings: (earnings: Earning[]) => void;
  setTotalEarnings: (total: number) => void;
  setTodayEarnings: (today: number) => void;
  setLoading: (loading: boolean) => void;
}

export const useEarningsStore = create<EarningsState>((set) => ({
  earnings: [],
  totalEarnings: 0,
  todayEarnings: 0,
  loading: false,

  setEarnings: (earnings) => set({ earnings }),
  setTotalEarnings: (totalEarnings) => set({ totalEarnings }),
  setTodayEarnings: (todayEarnings) => set({ todayEarnings }),
  setLoading: (loading) => set({ loading }),
}));