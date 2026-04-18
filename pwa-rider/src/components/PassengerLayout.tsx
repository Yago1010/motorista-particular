import { useRef, useState, type ChangeEvent } from 'react'
import { Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { clearSession, readSession } from '../lib/storage'
import { PassengerDrawer } from './PassengerDrawer'
import { PwaInstallPrompt } from './PwaInstallPrompt'
import { PassengerTabBar } from './PassengerTabBar'
import { SplashGate } from './SplashGate'

export function PassengerLayout() {
  const session = readSession()
  const navigate = useNavigate()
  const location = useLocation()
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const [photoHint, setPhotoHint] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  const pathname = location.pathname
  const mapMode = false
  const statusMode = pathname.startsWith('/status')
  const ridePlanMode = pathname === '/destino' || pathname === '/confirmar'
  const shellMap = mapMode && !statusMode

  const initials =
    `${session?.first_name?.trim()?.[0] ?? ''}${session?.last_name?.trim()?.[0] ?? ''}`.toUpperCase() || '?'

  function onCameraChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (f) {
      setPhotoHint('Foto capturada')
      window.setTimeout(() => setPhotoHint(''), 2500)
    }
  }

  if (!session) {
    return <Navigate to="/" replace />
  }

  return (
    <div
      className={`pwa-shell${shellMap ? ' pwa-shell--map' : ''}${statusMode ? ' pwa-shell--status' : ''}${ridePlanMode ? ' pwa-shell--ride-flow' : ''}`}
    >
      {statusMode ? (
        <header className="pwa-status-header">
          <button
            type="button"
            className="pwa-status-back"
            onClick={() => navigate('/home')}
            aria-label="Voltar ao início"
          >
            ←
          </button>
          <span className="pwa-status-title">A tua viagem</span>
          <button
            type="button"
            className="pwa-status-signout"
            onClick={() => {
              clearSession()
              navigate('/', { replace: true })
            }}
          >
            Sair
          </button>
        </header>
      ) : ridePlanMode ? null : (
        <header className={`pwa-header-99${shellMap ? ' pwa-header-99--floating' : ''}`}>
          <div className="pwa-header-99-left">
            <button
              type="button"
              className="pwa-header-99-burger"
              aria-label="Abrir menu"
              aria-expanded={menuOpen}
              aria-controls="pwa-passenger-drawer"
              onClick={() => setMenuOpen(true)}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M5 7h14M5 12h14M5 17h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <div className="pwa-header-99-avatar" aria-hidden>
              {initials}
            </div>
            <div className="pwa-header-99-greet">
              <span className="pwa-header-99-hi">Olá, {session.first_name}!</span>
              <img src="/chama-logo.png" alt="" className="pwa-header-99-logo" />
            </div>
          </div>
          <div className="pwa-header-99-right">
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="pwa-camera-input"
              aria-hidden
              tabIndex={-1}
              onChange={onCameraChange}
            />
            <button
              type="button"
              className="pwa-header-99-camera"
              aria-label="Tirar foto"
              onClick={() => cameraInputRef.current?.click()}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M4 8h3l1.5-2h7L17 8h3a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z"
                  stroke="currentColor"
                  strokeWidth="1.75"
                />
                <circle cx="12" cy="13" r="3.25" stroke="currentColor" strokeWidth="1.75" />
              </svg>
            </button>
          </div>
        </header>
      )}
      {photoHint ? (
        <div className="pwa-toast-hint" role="status">
          {photoHint}
        </div>
      ) : null}
      <main
        className={
          shellMap
            ? 'pwa-shell-main pwa-shell-main--map pwa-shell-main--with-tabs'
            : statusMode
              ? 'pwa-shell-main pwa-shell-main--status'
              : ridePlanMode
                ? 'pwa-shell-main pwa-shell-main--ride-flow'
                : 'pwa-shell-main pwa-shell-main--with-tabs'
        }
      >
        <Outlet />
      </main>
      {!statusMode && !ridePlanMode ? <PassengerTabBar /> : null}
      {!statusMode && !ridePlanMode ? (
        <PassengerDrawer open={menuOpen} onClose={() => setMenuOpen(false)} session={session} />
      ) : null}
      <PwaInstallPrompt />
      <SplashGate />
    </div>
  )
}
