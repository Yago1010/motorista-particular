import type { ReactNode } from 'react'

interface ChamaAuthShellProps {
  heading: string
  children: ReactNode
  footer?: string
}

import { CHAMA_LOGO_URL } from '@/config/brand'

export default function ChamaAuthShell({ heading, children, footer }: ChamaAuthShellProps) {
  return (
    <div id="pwa-login-page">
      <img src={CHAMA_LOGO_URL} alt="Chama no 12" className="pwa-imghome" />
      <div className="pwa-form-login">
        <h2 className="pwa-form-login-heading">{heading}</h2>
        <div className="pwa-login-wrap">{children}</div>
      </div>
      {footer && (
        <p className="pwa-muted" style={{ textAlign: 'center', marginTop: '1.5rem', maxWidth: 360 }}>
          {footer}
        </p>
      )}
    </div>
  )
}
