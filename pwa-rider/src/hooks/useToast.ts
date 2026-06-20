import { toast } from 'sonner'

export function useToast() {
  return {
    showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
      if (type === 'success') toast.success(message)
      else if (type === 'error') toast.error(message)
      else if (type === 'warning') toast.warning(message)
      else toast.info(message)
    },
  }
}
