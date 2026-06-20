import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/services/api';
import { clearDriverSession, syncDriverApiToken } from '@/utils/authSession';
import { resetDriverAppSession } from '@/utils/resetAppSession';
import { useRidesStore } from '@/stores/rides';

export interface DriverUser {
  id: number;
  token: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
}

interface AuthState {
  user: DriverUser | null;
  token: string | null;
  loading: boolean;
  loadingMessage: string;
  isOnline: boolean;
  isPaused: boolean;
  isAuthenticated: boolean;
  authReady: boolean;

  initAuth: () => Promise<void>;
  forceLogout: () => void;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (data: any) => Promise<{ success: boolean; message?: string }>;
  validateSelfie: (imageFile: File) => Promise<{ success: boolean; data?: any; message?: string }>;
  logout: () => Promise<void>;
  toggleOnline: (status: boolean) => Promise<{ success: boolean; message?: string }>;
  togglePause: (paused: boolean) => Promise<{ success: boolean; message?: string }>;
  updateLocation: (lat: number, lng: number) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,
      loadingMessage: '',
      isOnline: false,
      isPaused: false,
      isAuthenticated: false,
      authReady: false,

      initAuth: async () => {
        const savedToken = localStorage.getItem('driver_token');
        const savedUser = localStorage.getItem('driver_user');

        if (savedToken && savedUser) {
          try {
            const userData = JSON.parse(savedUser);
            syncDriverApiToken(savedToken);
            set({ token: savedToken, user: userData, isAuthenticated: true });
          } catch (error) {
            resetDriverAppSession();
            useRidesStore.setState({ currentRide: null, pendingRides: [], rides: [] });
            set({ token: null, user: null, isAuthenticated: false });
          }
        }
      },

      forceLogout: () => {
        resetDriverAppSession();
        useRidesStore.setState({ currentRide: null, pendingRides: [], rides: [] });
        set({ token: null, user: null, isAuthenticated: false, isOnline: false, loading: false });
      },

      login: async (email, password) => {
        set({ loading: true, loadingMessage: 'Entrando...' });
        try {
          const response = await api.post('driver/login', { email, password });
          const { token: newToken, user: userData } = response.data;

          set({
            token: newToken,
            user: userData,
            isAuthenticated: true,
            loading: false,
          });
          localStorage.setItem('driver_token', newToken);
          localStorage.setItem('driver_user', JSON.stringify(userData));
          syncDriverApiToken(newToken);

          try {
            await api.post('driver/toggle-online', { is_online: true });
          } catch {
            /* backend pode falhar; HomeView tenta de novo */
          }
          set({ isOnline: true });

          return { success: true };
        } catch (error: any) {
          set({ loading: false });
          const { isDemoDriverCredentials, buildDemoDriverSession } = await import('@/config/demoUsers');
          if (isDemoDriverCredentials(email, password)) {
            const session = buildDemoDriverSession();
            localStorage.setItem('chama_demo', '1');
            set({ token: session.token, user: session.user, isAuthenticated: true });
            localStorage.setItem('driver_token', session.token);
            localStorage.setItem('driver_user', JSON.stringify(session.user));
            syncDriverApiToken(session.token);
            return { success: true };
          }
          return { success: false, message: error.response?.data?.message || 'Erro ao entrar' };
        }
      },

      register: async (data) => {
        set({ loading: true, loadingMessage: 'Cadastrando...' });
        try {
          const response = await api.post('driver/register', data);
          const { token: newToken, user: userData } = response.data;

          set({
            token: newToken,
            user: userData,
            isAuthenticated: true,
            loading: false,
          });
          localStorage.setItem('driver_token', newToken);
          localStorage.setItem('driver_user', JSON.stringify(userData));
          syncDriverApiToken(newToken);

          return { success: true };
        } catch (error: any) {
          set({ loading: false });
          return { success: false, message: error.response?.data?.message || 'Erro ao cadastrar' };
        }
      },

      validateSelfie: async (imageFile) => {
        try {
          const formData = new FormData();
          formData.append('selfie', imageFile);

          const response = await api.post('driver/validate-selfie', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          return { success: true, data: response.data };
        } catch (error: any) {
          return { success: false, message: error.response?.data?.message || 'Erro na validação da selfie' };
        }
      },

      logout: async () => {
        set({ loading: true, loadingMessage: 'Saindo...' });
        try {
          await api.post('driver/logout');
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          resetDriverAppSession();
          useRidesStore.setState({ currentRide: null, pendingRides: [], rides: [] });
          set({
            token: null,
            user: null,
            isOnline: false,
            isAuthenticated: false,
            loading: false,
          });
        }
      },

      toggleOnline: async (status) => {
        try {
          await api.post('driver/toggle-online', { is_online: status });
        } catch {
          // fallback offline
        }
        set({ isOnline: status });
        return { success: true };
      },

      togglePause: async (paused) => {
        try {
          await api.post('driver/availability/pause', { is_paused: paused });
        } catch {
          // fallback offline
        }
        set({ isPaused: paused });
        return { success: true };
      },

      updateLocation: async (lat, lng) => {
        try {
          await api.post('driver/location', { latitude: lat, longitude: lng });
        } catch (error) {
          console.error('Update location error:', error);
        }
      },
    }),
    {
      name: 'driver-auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isOnline: state.isOnline,
        isPaused: state.isPaused,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) syncDriverApiToken(state.token);
      },
    }
  )
);

useAuthStore.persist.onFinishHydration(() => {
  useAuthStore.setState({ authReady: true });
});
