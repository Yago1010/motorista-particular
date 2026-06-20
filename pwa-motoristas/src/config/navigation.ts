import {
  Home,
  List,
  Gauge,
  BarChart3,
  User,
  Wallet,
  FileText,
  Calendar,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  path: string
  label: string
  icon: LucideIcon
  exact?: boolean
  muted?: boolean
  badge?: string
}

export const driverTabBarItems: NavItem[] = [
  { path: '/', label: 'Início', icon: Home, exact: true },
  { path: '/trips', label: 'Corridas', icon: List },
  { path: '/taxmeter', label: 'Maçaneta', icon: Gauge },
  { path: '/earnings', label: 'Relatório', icon: BarChart3 },
  { path: '/profile', label: 'Perfil', icon: User },
]

export const driverDrawerItems: NavItem[] = [
  ...driverTabBarItems,
  { path: '/wallet', label: 'Carteira', icon: Wallet },
  { path: '/documents', label: 'Documentos', icon: FileText, muted: true },
  { path: '/availability', label: 'Disponibilidade', icon: Calendar, muted: true },
]
