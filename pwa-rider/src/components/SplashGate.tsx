import { useEffect, useState } from 'react'

const SPLASH_MS = 1800

export function SplashGate() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = window.setTimeout(() => setVisible(false), SPLASH_MS)
    return () => window.clearTimeout(t)
  }, [])

  if (!visible) return null

  return (
    <div className="pwa-splash" role="presentation">
      <img src="/chama-logo.png" alt="" className="pwa-splash-logo" />
    </div>
  )
}
