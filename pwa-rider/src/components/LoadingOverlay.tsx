import { CHAMA_LOGO_URL } from '@/config/brand'

interface LoadingOverlayProps {
  message?: string
}

export default function LoadingOverlay({ message }: LoadingOverlayProps) {
  return (
    <div className="pwa-splash" style={{ flexDirection: 'column', gap: '1rem' }}>
      <img src={CHAMA_LOGO_URL} alt="Chama no 12" className="pwa-splash-logo" />
      <p style={{ color: '#031105', fontWeight: 700, fontSize: '0.95rem' }}>{message || 'Carregando...'}</p>
    </div>
  )
}
