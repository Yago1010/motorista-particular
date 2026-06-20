import { Home, History, Wallet, User, type LucideIcon } from 'lucide-react'

export interface NavItem {
  path: string
  label: string
  icon: LucideIcon
  exact?: boolean
  muted?: boolean
  badge?: string
}

export const riderTabBarItems: NavItem[] = [
  { path: '/', label: 'Início', icon: Home, exact: true },
  { path: '/trips', label: 'Viagens', icon: History },
  { path: '/wallet', label: 'Carteira', icon: Wallet },
  { path: '/profile', label: 'Perfil', icon: User },
]

export const riderDrawerItems: NavItem[] = riderTabBarItems
