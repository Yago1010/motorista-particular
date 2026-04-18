import { NavLink } from 'react-router-dom'

export function PassengerTabBar() {
  return (
    <nav className="pwa-tabbar" aria-label="Navegação principal">
      <NavLink to="/home" className={({ isActive }) => `pwa-tabbar-item${isActive ? ' pwa-tabbar-item--active' : ''}`} end>
        <span className="pwa-tabbar-icon" aria-hidden>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
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
        </span>
        <span className="pwa-tabbar-label">Corrida</span>
      </NavLink>
      <NavLink to="/entrega" className={({ isActive }) => `pwa-tabbar-item${isActive ? ' pwa-tabbar-item--active' : ''}`}>
        <span className="pwa-tabbar-icon" aria-hidden>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 8h16v10a1 1 0 01-1 1H5a1 1 0 01-1-1V8zM4 8V6a1 1 0 011-1h3l2-2h6l2 2h3a1 1 0 011 1v2"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className="pwa-tabbar-label">Entrega</span>
      </NavLink>
      <NavLink to="/pagar" className={({ isActive }) => `pwa-tabbar-item${isActive ? ' pwa-tabbar-item--active' : ''}`}>
        <span className="pwa-tabbar-icon" aria-hidden>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.75" />
            <path d="M7 12h10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        </span>
        <span className="pwa-tabbar-label">Pagar</span>
      </NavLink>
    </nav>
  )
}
