import { getDevBackendHint } from '../lib/http'

export function DevFooter() {
  if (!import.meta.env.DEV) return null
  const hint = getDevBackendHint()
  return (
    <footer className="pwa-dev-footer">
      Dev — proxy Laravel: {hint || '(mesma origem)'} · pedidos /user via Vite
    </footer>
  )
}
