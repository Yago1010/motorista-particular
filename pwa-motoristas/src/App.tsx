import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { router } from '@/router'
import { useAuthStore } from '@/stores/auth'
import LoadingOverlay from '@/components/LoadingOverlay'
import './assets/main.css'
import 'leaflet/dist/leaflet.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  const { initAuth, loading, loadingMessage, authReady } = useAuthStore()

  useEffect(() => {
    initAuth()
    if (useAuthStore.persist.hasHydrated()) {
      useAuthStore.setState({ authReady: true })
    }
  }, [initAuth])

  if (!authReady || loading) {
    return <LoadingOverlay message={loadingMessage || 'Carregando...'} />
  }

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster
        position="bottom-right"
        toastOptions={{
          classNames: {
            toast: 'bg-card border border-border',
            description: 'text-muted-foreground',
            actionButton: 'bg-primary hover:bg-primary/90',
            cancelButton: 'bg-secondary hover:bg-secondary/80',
          },
        }}
      />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

export default App