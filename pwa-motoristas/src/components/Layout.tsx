import { Outlet, Link, useLocation } from 'react-router-dom'
import { Home, List, Gauge, History, BarChart3 } from 'lucide-react'
import { clsx } from 'clsx'
import { useAuthStore } from '@/stores/auth'

export default function Layout() {
  const location = useLocation()
  const authStore = useAuthStore()

  const driverName = authStore.user
    ? `${authStore.user.first_name} ${authStore.user.last_name || ''}`.trim()
    : 'Motorista'

  const navItems = [
    { path: '/', label: 'Início', icon: Home, exact: true },
    { path: '/trips', label: 'Aberta', icon: List },
    { path: '/taxmeter', label: 'Maçaneta', icon: Gauge },
    { path: '/trips', label: 'Histórico', icon: History },
    { path: '/earnings', label: 'Relatório', icon: BarChart3 },
  ] as const

  const isActive = (path: string, exact = false) => {
    if (exact) return location.pathname === path
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Motorista</p>
            <h1 className="font-bold font-heading text-sm">{driverName}</h1>
          </div>
          <span className="rounded-full bg-green-100 px-2 py-1 text-[10px] font-semibold text-green-700">
            GPS OK
          </span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto max-w-md mx-auto w-full pb-24">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card border-t border-border flex z-50">
        {navItems.map((item) => {
          const { path, label, icon: Icon } = item
          const exact = 'exact' in item ? item.exact : false
          return (
          <Link
            key={`${path}-${label}`}
            to={path}
            className={clsx(
              'flex-1 flex flex-col items-center justify-center py-2 gap-1 transition-colors',
              isActive(path, exact) ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        )})}
      </nav>
    </div>
  )
}
