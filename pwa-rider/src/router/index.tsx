import { createBrowserRouter, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'

import LoginView from '@/pages/LoginView'
import RegisterView from '@/pages/RegisterView'
import HomeView from '@/pages/HomeView'
import ChatView from '@/pages/ChatView'
import TripsView from '@/pages/TripsView'
import ProfileView from '@/pages/ProfileView'
import WalletView from '@/pages/WalletView'
import RequestRideView from '@/pages/RequestRideView'
import RideTrackingView from '@/pages/RideTrackingView'
import PaymentView from '@/pages/PaymentView'

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

export const router = createBrowserRouter(
  [
    {
      path: '/home',
      element: <Navigate to="/" replace />,
    },

    {
      path: '/',
      element: (
        <ProtectedRoute>
          <HomeView />
        </ProtectedRoute>
      ),
      errorElement: <ErrorPage />,
    },

    {
      path: '/request-ride',
      element: (
        <ProtectedRoute>
          <RequestRideView />
        </ProtectedRoute>
      ),
      errorElement: <ErrorPage />,
    },

    {
      path: '/ride/:id',
      element: (
        <ProtectedRoute>
          <RideTrackingView />
        </ProtectedRoute>
      ),
      errorElement: <ErrorPage />,
    },

    {
      path: '/ride-tracking',
      element: <Navigate to="/" replace />,
    },

    {
      path: '/ride/:id/payment',
      element: (
        <ProtectedRoute>
          <PaymentView />
        </ProtectedRoute>
      ),
    },

    {
      path: '/chat/:rideId',
      element: (
        <ProtectedRoute>
          <ChatView />
        </ProtectedRoute>
      ),
      errorElement: <ErrorPage />,
    },

    {
      path: '/chat',
      element: (
        <ProtectedRoute>
          <ChatView />
        </ProtectedRoute>
      ),
      errorElement: <ErrorPage />,
    },

    {
      path: '/trips',
      element: (
        <ProtectedRoute>
          <TripsView />
        </ProtectedRoute>
      ),
      errorElement: <ErrorPage />,
    },

    {
      path: '/profile',
      element: (
        <ProtectedRoute>
          <ProfileView />
        </ProtectedRoute>
      ),
      errorElement: <ErrorPage />,
    },

    {
      path: '/wallet',
      element: (
        <ProtectedRoute>
          <WalletView />
        </ProtectedRoute>
      ),
      errorElement: <ErrorPage />,
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

    {
      path: '*',
      element: <NotFound />,
    },
  ],
  {
    basename: '/pwa-rider',
  }
)

export default router
