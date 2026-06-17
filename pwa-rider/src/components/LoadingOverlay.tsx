interface LoadingOverlayProps {
  message?: string
}

export default function LoadingOverlay({ message }: LoadingOverlayProps) {
  return (
    <div className="loading-overlay" style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(255,255,255,0.9)',
      zIndex: 9998,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem'
    }}>
      <div className="spinner" style={{
        width: '40px',
        height: '40px',
        border: '4px solid rgba(0,0,0,0.1)',
        borderTopColor: '#007bff',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <div style={{ 
        fontSize: '1rem', 
        color: 'var(--gray-700)',
        fontWeight: 500
      }}>{message || 'Carregando...'}</div>
    </div>
  )
}