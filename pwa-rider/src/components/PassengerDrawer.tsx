import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import type { RiderSession } from '../types'
import { clearSession } from '../lib/storage'

type PassengerDrawerProps = {
  open: boolean
  onClose: () => void
  session: RiderSession
}

function IconClock() {
  return (
    <svg className="pwa-drawer-ico" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
      <path d="M12 7v6l4 2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function IconWallet() {
  return (
    <svg className="pwa-drawer-ico" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  )
}

function IconHelp() {
  return (
    <svg className="pwa-drawer-ico" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
      <path d="M9.5 9.5a2.5 2.5 0 114.2 1.8c-.6.4-1.2 1-1.2 2.2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="12" cy="17" r="0.75" fill="currentColor" />
    </svg>
  )
}

function IconChat() {
  return (
    <svg className="pwa-drawer-ico" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 19l-2 2V6a2 2 0 012-2h12a2 2 0 012 2v9a2 2 0 01-2 2H6z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconShield() {
  return (
    <svg className="pwa-drawer-ico" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V7l8-4z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconCard() {
  return (
    <svg className="pwa-drawer-ico" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  )
}

function IconGear() {
  return (
    <svg className="pwa-drawer-ico" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82c.14.49.53.85 1.02.98H21a2 2 0 010 4h-.09c-.49.13-.88.49-1.02.98z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconGift() {
  return (
    <svg className="pwa-drawer-ico" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="8" width="18" height="13" rx="1" stroke="currentColor" strokeWidth="1.75" />
      <path d="M12 8V21M3 12h18M8 8h8a3 3 0 10-3-3 3 3 0 00-3 3 3 3 0 00-3-3 3 3 0 00-3 3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function IconScan() {
  return (
    <svg className="pwa-drawer-ico" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M7 3H4v3M17 3h3v3M7 21H4v-3M17 21h3v-3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <rect x="8" y="8" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  )
}

function IconDownload() {
  return (
    <svg className="pwa-drawer-ico" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3v11" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M8 10l4 4 4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="4" y="16" width="16" height="4" rx="1" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  )
}

function IconCar() {
  return (
    <svg className="pwa-drawer-ico" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 11l1.5-4.5a1 1 0 011-.65h9a1 1 0 011 .65L19 11M5 11h14M5 11l-1 5h16l-1-5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="16" r="1.5" fill="currentColor" />
      <circle cx="16" cy="16" r="1.5" fill="currentColor" />
    </svg>
  )
}

function IconBox() {
  return (
    <svg className="pwa-drawer-ico" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 8h16v10a1 1 0 01-1 1H5a1 1 0 01-1-1V8zM4 8V6a1 1 0 011-1h3l2-2h6l2 2h3a1 1 0 011 1v2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

export function PassengerDrawer({ open, onClose, session }: PassengerDrawerProps) {
  const navigate = useNavigate()

  const initials =
    `${session.first_name?.trim()?.[0] ?? ''}${session.last_name?.trim()?.[0] ?? ''}`.toUpperCase() || '?'

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prev
      }
    }
    return undefined
  }, [open])

  function go(path: string) {
    navigate(path)
    onClose()
  }

  function installApp() {
    window.dispatchEvent(new Event('pwa-install-request'))
    onClose()
  }

  function signOut() {
    clearSession()
    onClose()
    navigate('/', { replace: true })
  }

  if (!open) return null

  const panel = (
    <div className="pwa-drawer-root">
      <button type="button" className="pwa-drawer-backdrop" aria-label="Fechar menu" onClick={onClose} />
      <aside
        id="pwa-passenger-drawer"
        className="pwa-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwa-drawer-title"
      >
        <div className="pwa-drawer-topbar">
          <img src="/chama-logo.png" alt="CHAMA NO 12" className="pwa-drawer-toplogo" />
          <button type="button" className="pwa-drawer-close" onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </div>

        <div className="pwa-drawer-hero">
          <div className="pwa-drawer-hero-text">
            <h2 id="pwa-drawer-title" className="pwa-drawer-name">
              {session.first_name} {session.last_name}
            </h2>
            <p className="pwa-drawer-email">{session.email}</p>
            <button type="button" className="pwa-drawer-edit" onClick={() => go('/perfil')}>
              Editar as minhas informações ›
            </button>
          </div>
          <div className="pwa-drawer-avatar-wrap">
            <span className="pwa-drawer-avatar" aria-hidden>
              {initials}
            </span>
            <span className="pwa-drawer-avatar-dot" aria-hidden />
          </div>
        </div>

        <nav className="pwa-drawer-nav" aria-label="Menu da conta">
          <button type="button" className="pwa-drawer-item" onClick={() => go('/home')}>
            <IconCar />
            <span>Pedir corrida</span>
          </button>
          <button type="button" className="pwa-drawer-item" onClick={() => go('/entrega')}>
            <IconBox />
            <span>Entrega</span>
          </button>
          <button type="button" className="pwa-drawer-item" onClick={() => go('/pagar')}>
            <IconWallet />
            <span>Pagar / carteira</span>
          </button>
          <button type="button" className="pwa-drawer-item" onClick={() => go('/atividade')}>
            <IconClock />
            <span>Atividade</span>
          </button>
          <button type="button" className="pwa-drawer-item" onClick={() => go('/ajuda')}>
            <IconHelp />
            <span>Ajuda</span>
          </button>
          <button type="button" className="pwa-drawer-item" onClick={() => go('/mensagens')}>
            <IconChat />
            <span>Mensagens</span>
          </button>
          <button type="button" className="pwa-drawer-item" onClick={() => go('/seguranca')}>
            <IconShield />
            <span>Central de segurança</span>
          </button>
          <button type="button" className="pwa-drawer-item" onClick={() => go('/metodos-pagamento')}>
            <IconCard />
            <span>Métodos de pagamento</span>
          </button>
          <button type="button" className="pwa-drawer-item" onClick={() => go('/configuracoes')}>
            <IconGear />
            <span>Configurações</span>
          </button>
          <button type="button" className="pwa-drawer-item" onClick={installApp}>
            <IconDownload />
            <span>Baixar app no telemóvel</span>
          </button>
          <div className="pwa-drawer-divider" />
          <button type="button" className="pwa-drawer-item" onClick={() => go('/convidar-amigos')}>
            <IconGift />
            <span>Convidar amigos</span>
          </button>
          <button type="button" className="pwa-drawer-item" onClick={() => go('/escanear')}>
            <IconScan />
            <span>Escanear</span>
          </button>
        </nav>

        <div className="pwa-drawer-footer">
          <button type="button" className="pwa-drawer-sair" onClick={signOut}>
            Sair da conta
          </button>
        </div>
      </aside>
    </div>
  )

  return createPortal(panel, document.body)
}
