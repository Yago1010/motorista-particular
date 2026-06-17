import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/services/api';
import socketService from '@/services/socket';

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
  isAuthenticated: boolean;
  
  initAuth: () => Promise<void>;
  login: (cpf: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (data: any) => Promise<{ success: boolean; message?: string }>;
  validateSelfie: (imageFile: File) => Promise<{ success: boolean; data?: any; message?: string }>;
  logout: () => Promise<void>;
  toggleOnline: (status: boolean) => Promise<{ success: boolean; message?: string }>;
  updateLocation: (lat: number, lng: number) => Promise<void>;
  connectSocket: () => Promise<void>;
}

const handleRideRequest = (data: any) => console.log('New ride request:', data);
const handleRideCancelled = (data: any) => console.log('Ride cancelled:', data);
const handleRideAccepted = (data: any) => console.log('Ride accepted:', data);
const handleNewMessage = (data: any) => console.log('New message:', data);
const handleDriverStatus = (data: any) => console.log('Driver status:', data);

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,
      loadingMessage: '',
      isOnline: false,
      isAuthenticated: false,

      initAuth: async () => {
        const savedToken = localStorage.getItem('driver_token');
        const savedUser = localStorage.getItem('driver_user');

        if (savedToken && savedUser) {
          try {
            const userData = JSON.parse(savedUser);
            set({ token: savedToken, user: userData, isAuthenticated: true });
            api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
            await get().connectSocket();
          } catch (error) {
            localStorage.removeItem('driver_token');
            localStorage.removeItem('driver_user');
            set({ token: null, user: null, isAuthenticated: false });
          }
        }
      },

      login: async (cpf, password) => {
        set({ loading: true, loadingMessage: 'Entrando...' });
        try {
          const response = await api.post('/api/driver/login', { cpf, password });
          const { token: newToken, user: userData } = response.data;

          set({
            token: newToken,
            user: userData,
            isAuthenticated: true,
            loading: false,
          });
          localStorage.setItem('driver_token', newToken);
          localStorage.setItem('driver_user', JSON.stringify(userData));
          api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

          await get().connectSocket();
          return { success: true };
        } catch (error: any) {
          set({ loading: false });
          return { success: false, message: error.response?.data?.message || 'Erro ao entrar' };
        }
      },

      register: async (data) => {
        set({ loading: true, loadingMessage: 'Cadastrando...' });
        try {
          const response = await api.post('/api/driver/register', data);
          const { token: newToken, user: userData } = response.data;

          set({
            token: newToken,
            user: userData,
            isAuthenticated: true,
            loading: false,
          });
          localStorage.setItem('driver_token', newToken);
          localStorage.setItem('driver_user', JSON.stringify(userData));
          api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

          await get().connectSocket();
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

          const response = await api.post('/api/driver/validate-selfie', formData, {
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
          await api.post('/api/driver/logout');
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            token: null,
            user: null,
            isOnline: false,
            isAuthenticated: false,
            loading: false,
          });
          localStorage.removeItem('driver_token');
          localStorage.removeItem('driver_user');
          delete api.defaults.headers.common['Authorization'];
          socketService.disconnect();
        }
      },

      connectSocket: async () => {
        const { token } = get();
        if (!token) return;

        try {
          await socketService.connect(token);
          socketService.on('ride:request', handleRideRequest);
          socketService.on('ride:cancelled', handleRideCancelled);
          socketService.on('ride:accepted', handleRideAccepted);
          socketService.on('message:new', handleNewMessage);
          socketService.on('driver:status', handleDriverStatus);
        } catch (error) {
          console.error('Socket connection error:', error);
        }
      },

      toggleOnline: async (status) => {
        try {
          await api.post('/api/driver/toggle-online', { is_online: status });
          set({ isOnline: status });
          socketService.emit('driver:status', { is_online: status });
          return { success: true };
        } catch (error: any) {
          return { success: false, message: error.response?.data?.message || 'Erro ao alterar status' };
        }
      },

      updateLocation: async (lat, lng) => {
        try {
          await api.post('/api/driver/location', { latitude: lat, longitude: lng });
          socketService.emit('driver:location', { latitude: lat, longitude: lng });
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
      }),
    }
  )
);