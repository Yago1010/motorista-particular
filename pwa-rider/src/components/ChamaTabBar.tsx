import { Link, useLocation } from 'react-router-dom'
import { clsx } from 'clsx'
import type { LucideIcon } from 'lucide-react'

export interface TabBarItem {
  path: string
  label: string
  icon: LucideIcon
  exact?: boolean
}

interface ChamaTabBarProps {
  items: TabBarItem[]
}

export default function ChamaTabBar({ items }: ChamaTabBarProps) {
  const location = useLocation()

  const isActive = (path: string, exact = false) => {
    if (path === '/' && /^\/ride\/\d+/.test(location.pathname)) return true
    if (exact) return location.pathname === path
    return location.pathname.startsWith(path)
  }

  return (
    <nav className="pwa-tabbar" aria-label="Navegação principal">
      {items.map(({ path, label, icon: Icon, exact }) => {
        const active = isActive(path, exact)
        return (
          <Link
            key={path}
            to={path}
            className={clsx('pwa-tabbar-item', active && 'pwa-tabbar-item--active')}
          >
            <span className="pwa-tabbar-icon">
              <Icon size={active ? 22 : 20} strokeWidth={2.2} />
            </span>
            <span className="pwa-tabbar-label">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
