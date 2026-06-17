import { createBrowserRouter, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import Layout from '@/components/Layout'
import LoginView from '@/views/LoginView'
import RegisterView from '@/views/RegisterView'
import HomeView from '@/views/HomeView'
import RideDetailView from '@/views/RideDetailView'
import ChatView from '@/views/ChatView'
import TripsView from '@/views/TripsView'
import EarningsView from '@/views/EarningsView'
import ProfileView from '@/views/ProfileView'
import WalletView from '@/views/WalletView'
import AvailabilityView from '@/views/AvailabilityView'
import DocumentsView from '@/views/DocumentsView'
import TaximeterView from '@/views/TaximeterView'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuthStore()

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuthStore()

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <HomeView /> },
      { path: 'ride/:id', element: <RideDetailView /> },
      { path: 'chat/:rideId', element: <ChatView /> },
      { path: 'trips', element: <TripsView /> },
      { path: 'earnings', element: <EarningsView /> },
      { path: 'profile', element: <ProfileView /> },
      { path: 'wallet', element: <WalletView /> },
      { path: 'availability', element: <AvailabilityView /> },
      { path: 'documents', element: <DocumentsView /> },
      { path: 'taxmeter', element: <TaximeterView /> },
    ],
  },
  {
    path: '/login',
    element: (
      <PublicRoute>
        <LoginView />
      </PublicRoute>
    ),
  },
  {
    path: '/register',
    element: (
      <PublicRoute>
        <RegisterView />
      </PublicRoute>
    ),
  },
])

export default router