import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { CHAMA_LOGO_URL } from '@/config/brand'

export interface DrawerNavItem {
  path: string
  label: string
  icon: LucideIcon
  badge?: string
  muted?: boolean
}

interface ChamaDrawerProps {
  open: boolean
  onClose: () => void
  userName: string
  userEmail?: string
  userInitial: string
  items: DrawerNavItem[]
  onLogout: () => void
  editProfilePath?: string
}

export default function ChamaDrawer({
  open,
  onClose,
  userName,
  userEmail,
  userInitial,
  items,
  onLogout,
  editProfilePath = '/profile',
}: ChamaDrawerProps) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null

  return (
    <div className="pwa-drawer-root" role="dialog" aria-modal="true" aria-label="Menu">
      <button type="button" className="pwa-drawer-backdrop" aria-label="Fechar menu" onClick={onClose} />
      <aside className="pwa-drawer">
        <div className="pwa-drawer-topbar">
          <img src={CHAMA_LOGO_URL} alt="Chama no 12" className="pwa-drawer-toplogo" />
          <button type="button" className="pwa-drawer-close" onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </div>

        <div className="pwa-drawer-hero">
          <div className="pwa-drawer-hero-text">
            <h2 className="pwa-drawer-name">{userName}</h2>
            {userEmail && <p className="pwa-drawer-email">{userEmail}</p>}
            <Link to={editProfilePath} className="pwa-drawer-edit" onClick={onClose}>
              Editar perfil
            </Link>
          </div>
          <div className="pwa-drawer-avatar-wrap">
            <div className="pwa-drawer-avatar">{userInitial}</div>
            <span className="pwa-drawer-avatar-dot" aria-hidden />
          </div>
        </div>

        <nav className="pwa-drawer-nav">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.path + item.label}
                to={item.path}
                className={`pwa-drawer-item${item.muted ? ' pwa-drawer-item--muted' : ''}`}
                onClick={onClose}
              >
                <Icon className="pwa-drawer-ico" size={22} strokeWidth={2} />
                {item.label}
                {item.badge && <span className="pwa-drawer-badge">{item.badge}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="pwa-drawer-footer">
          <button
            type="button"
            className="pwa-drawer-sair"
            onClick={() => {
              onClose()
              onLogout()
            }}
          >
            Sair da conta
          </button>
        </div>
      </aside>
    </div>
  )
}
