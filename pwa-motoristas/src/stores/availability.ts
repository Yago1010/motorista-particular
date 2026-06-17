import { create } from 'zustand';

export interface AvailabilitySlot {
  day_of_week: number; // 0-6
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  is_active: boolean;
}

interface AvailabilityState {
  slots: AvailabilitySlot[];
  loading: boolean;
  
  setSlots: (slots: AvailabilitySlot[]) => void;
  updateSlot: (slot: AvailabilitySlot) => void;
  setLoading: (loading: boolean) => void;
}

export const useAvailabilityStore = create<AvailabilityState>((set) => ({
  slots: [],
  loading: false,

  setSlots: (slots) => set({ slots }),
  updateSlot: (slot) => set((state) => ({
    slots: state.slots.map((s) => 
      s.day_of_week === slot.day_of_week && s.start_time === slot.start_time ? slot : s
    ),
  })),
  setLoading: (loading) => set({ loading }),
}));