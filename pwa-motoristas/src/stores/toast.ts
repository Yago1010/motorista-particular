import { create } from 'zustand'

interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}

interface ToastState {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => string
  removeToast: (id: string) => void
  clearToasts: () => void
  success: (message: string, duration?: number) => string
  error: (message: string, duration?: number) => string
  warning: (message: string, duration?: number) => string
  info: (message: string, duration?: number) => string
}

let toastId = 0

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  addToast: (toast) => {
    const id = String(++toastId)
    const newToast = { ...toast, id }
    set((state) => ({ toasts: [...state.toasts, newToast] }))

    if (toast.duration !== 0) {
      setTimeout(() => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
      }, toast.duration || 4000)
    }
    return id
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  clearToasts: () => set({ toasts: [] }),
  success: (message: string, duration?: number) => get().addToast({ message, type: 'success', duration }),
  error: (message: string, duration?: number) => get().addToast({ message, type: 'error', duration }),
  warning: (message: string, duration?: number) => get().addToast({ message, type: 'warning', duration }),
  info: (message: string, duration?: number) => get().addToast({ message, type: 'info', duration }),
}))

export function toast(message: string, type: Toast['type'] = 'info', duration?: number) {
  return useToastStore.getState().addToast({ message, type, duration })
}

toast.success = (message: string, duration?: number) => toast(message, 'success', duration)
toast.error = (message: string, duration?: number) => toast(message, 'error', duration)
toast.warning = (message: string, duration?: number) => toast(message, 'warning', duration)
toast.info = (message: string, duration?: number) => toast(message, 'info', duration)