type LocationPermissionScreenProps = {
  geoBusy: boolean
  onRetryGps: () => void
  message?: string
}

export function LocationPermissionScreen({ geoBusy, onRetryGps, message }: LocationPermissionScreenProps) {
  return (
    <div className="pwa-location-screen">
      <div className="pwa-location-header">
        <div className="pwa-location-illus" aria-hidden>
          <svg viewBox="0 0 200 140" className="pwa-location-illus-svg">
            <rect x="55" y="20" width="90" height="100" rx="10" fill="rgba(255,255,255,0.12)" stroke="rgba(57,255,106,0.4)" />
            <circle cx="100" cy="55" r="14" fill="var(--chama-gold)" opacity="0.9" />
            <path d="M100 69 L100 95" stroke="var(--chama-neon)" strokeWidth="3" strokeLinecap="round" />
            <rect x="72" y="98" width="56" height="10" rx="5" fill="rgba(57,255,106,0.35)" />
          </svg>
        </div>
        <div className="pwa-location-wave" aria-hidden />
      </div>
      <div className="pwa-location-body">
        <h2 className="pwa-location-title">Ativar serviços de localização</h2>
        <p className="pwa-location-sub">Ativa a localização no browser do teu telemóvel para mostrar o mapa e pedir corrida.</p>
        {message ? <p className="pwa-location-msg">{message}</p> : null}
        <button type="button" className="pwa-location-btn-primary" disabled={geoBusy} onClick={onRetryGps}>
          {geoBusy ? 'A tentar…' : 'Ativar localização'}
        </button>
      </div>
    </div>
  )
}
