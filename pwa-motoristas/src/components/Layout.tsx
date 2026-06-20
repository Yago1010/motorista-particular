import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth'
import ChamaHeader from '@/components/ChamaHeader'
import ChamaDrawer from '@/components/ChamaDrawer'
import ChamaTabBar from '@/components/ChamaTabBar'
import { driverDrawerItems, driverTabBarItems } from '@/config/navigation'

export default function Layout() {
  const navigate = useNavigate()
  const authStore = useAuthStore()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const isOnline = authStore.isOnline
  const userName = authStore.user
    ? `${authStore.user.first_name} ${authStore.user.last_name || ''}`.trim()
    : 'Motorista'
  const userInitial = userName.charAt(0).toUpperCase()

  const logout = async () => {
    await authStore.logout()
    navigate('/login')
  }

  const toggleOnline = async () => {
    const next = !isOnline
    await authStore.toggleOnline(next)
    if (!next && authStore.isPaused) {
      await authStore.togglePause(false)
    }
    toast.success(next ? 'Você está online' : 'Você está offline')
  }

  return (
    <div className="chama-home chama-app-frame min-h-screen flex flex-col">
      <ChamaHeader
        userName={authStore.user?.first_name || 'Motorista'}
        userInitial={userInitial}
        onMenuOpen={() => setDrawerOpen(true)}
        right={
          <button
            type="button"
            onClick={toggleOnline}
            className={`chama-status-pill ${isOnline ? 'chama-status-pill--online' : ''}`}
          >
            {isOnline ? '● Online' : '○ Offline'}
          </button>
        }
      />

      <ChamaDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        userName={userName}
        userEmail={authStore.user?.email}
        userInitial={userInitial}
        items={driverDrawerItems}
        onLogout={logout}
      />

      <main className="chama-shell-main flex-1 overflow-y-auto">
        <Outlet />
      </main>

      <ChamaTabBar items={driverTabBarItems} />
    </div>
  )
}
