import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import ChamaHeader from '@/components/ChamaHeader'
import ChamaDrawer from '@/components/ChamaDrawer'
import ChamaTabBar from '@/components/ChamaTabBar'
import { riderDrawerItems, riderTabBarItems } from '@/config/navigation'

interface ChamaAppShellProps {
  children: ReactNode
  title?: string
  headerRight?: ReactNode
  hideTabBar?: boolean
}

export default function ChamaAppShell({
  children,
  title,
  headerRight,
  hideTabBar = false,
}: ChamaAppShellProps) {
  const navigate = useNavigate()
  const authStore = useAuthStore()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const userName = authStore.user
    ? `${authStore.user.first_name} ${authStore.user.last_name || ''}`.trim()
    : 'Passageiro'
  const userInitial = (authStore.user?.first_name || 'U').charAt(0).toUpperCase()

  const logout = async () => {
    await authStore.logout()
    navigate('/login')
  }

  return (
    <div className="chama-home chama-app-frame min-h-screen flex flex-col">
      <ChamaHeader
        userName={authStore.user?.first_name || 'Passageiro'}
        userInitial={userInitial}
        onMenuOpen={() => setDrawerOpen(true)}
        right={headerRight}
      />

      <ChamaDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        userName={userName}
        userEmail={authStore.user?.email}
        userInitial={userInitial}
        items={riderDrawerItems}
        onLogout={logout}
      />

      <main className="chama-shell-main flex-1 overflow-y-auto">
        {title && (
          <div className="chama-shell-titlebar">
            <h1>{title}</h1>
          </div>
        )}
        {children}
      </main>

      {!hideTabBar && <ChamaTabBar items={riderTabBarItems} />}
    </div>
  )
}
