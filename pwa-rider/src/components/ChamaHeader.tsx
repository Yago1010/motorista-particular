import type { ReactNode } from 'react'
import { Menu } from 'lucide-react'
import { CHAMA_LOGO_URL } from '@/config/brand'

interface ChamaHeaderProps {
  userName: string
  userInitial: string
  onMenuOpen: () => void
  floating?: boolean
  right?: ReactNode
}

export default function ChamaHeader({
  userName,
  userInitial,
  onMenuOpen,
  floating,
  right,
}: ChamaHeaderProps) {
  return (
    <header className={`pwa-header-99${floating ? ' pwa-header-99--floating' : ''}`}>
      <button type="button" className="pwa-header-99-burger" onClick={onMenuOpen} aria-label="Abrir menu">
        <Menu size={22} strokeWidth={2.5} />
      </button>

      <div className="pwa-header-99-left">
        <div className="pwa-header-99-avatar">{userInitial}</div>
        <div className="pwa-header-99-greet">
          <span className="pwa-header-99-hi">Olá, {userName}</span>
          <img src={CHAMA_LOGO_URL} alt="Chama no 12" className="pwa-header-99-logo" />
        </div>
      </div>

      {right && <div className="pwa-header-99-right">{right}</div>}
    </header>
  )
}
