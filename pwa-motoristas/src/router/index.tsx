import { createBrowserRouter, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'

import Layout from '@/components/Layout'

import LoginView from '@/pages/LoginView'
import RegisterView from '@/pages/RegisterView'
import HomeView from '@/pages/HomeView'
import RideDetailView from '@/pages/RideDetailView'
import ChatView from '@/pages/ChatView'
import TripsView from '@/pages/TripsView'
import EarningsView from '@/pages/EarningsView'
import ProfileView from '@/pages/ProfileView'
import WalletView from '@/pages/WalletView'
import AvailabilityView from '@/pages/AvailabilityView'
import DocumentsView from '@/pages/DocumentsView'
import TaximeterView from '@/pages/TaximeterView'

import LoadingOverlay from '@/components/LoadingOverlay'
import ErrorPage from '@/pages/ErrorPage'
import NotFound from '@/pages/NotFound'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, authReady } = useAuthStore()

  if (!authReady) {
    return <LoadingOverlay message="Carregando..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, authReady } = useAuthStore()

  if (!authReady) {
    return <LoadingOverlay message="Carregando..." />
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
    errorElement: <ErrorPage />,
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
      { path: '*', element: <NotFound /> },
    ],
  },
  {
    path: '/login',
    element: (
      <PublicRoute>
        <LoginView />
      </PublicRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: '/register',
    element: (
      <PublicRoute>
        <RegisterView />
      </PublicRoute>
    ),
    errorElement: <ErrorPage />,
  },
], { basename: '/pwa-motoristas' })

export default router