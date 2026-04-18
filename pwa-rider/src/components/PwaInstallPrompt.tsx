import { useEffect, useMemo, useState } from 'react'

const HIDE_KEY = 'pwa_install_hide_until'
const HIDE_MS = 1000 * 60 * 60 * 24 * 3

function isStandaloneMode() {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true
}

function isAndroidMobile() {
  return /android/i.test(navigator.userAgent)
}

function canShowBanner() {
  const until = Number(localStorage.getItem(HIDE_KEY) ?? 0)
  return Number.isNaN(until) || Date.now() > until
}

export function PwaInstallPrompt() {
  const [ready, setReady] = useState(false)
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [manualOpen, setManualOpen] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    if (isStandaloneMode()) return
    setDismissed(!canShowBanner())
    setReady(true)
  }, [])

  useEffect(() => {
    const onBeforeInstall = (ev: Event) => {
      ev.preventDefault()
      setDeferred(ev as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setDeferred(null)
      setDismissed(true)
      setManualOpen(false)
    }
    const onExternalRequest = () => {
      if (deferred) {
        void triggerInstall(deferred, setDeferred)
      } else {
        setManualOpen(true)
      }
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    window.addEventListener('pwa-install-request', onExternalRequest)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
      window.removeEventListener('pwa-install-request', onExternalRequest)
    }
  }, [deferred])

  const showInstall = useMemo(() => {
    if (!ready || dismissed || isStandaloneMode()) return false
    return !!deferred || isAndroidMobile()
  }, [ready, dismissed, deferred])

  if (!showInstall) return null

  return (
    <>
      <div className="pwa-install-banner" role="region" aria-label="Instalar app">
        <div className="pwa-install-copy">
          <strong>Instalar app no Android</strong>
          <span>Teste mais rápido em ecrã completo</span>
        </div>
        <button
          type="button"
          className="pwa-install-cta"
          onClick={() => {
            if (deferred) {
              void triggerInstall(deferred, setDeferred)
            } else {
              setManualOpen(true)
            }
          }}
        >
          Baixar app
        </button>
        <button
          type="button"
          className="pwa-install-close"
          aria-label="Dispensar"
          onClick={() => {
            localStorage.setItem(HIDE_KEY, String(Date.now() + HIDE_MS))
            setDismissed(true)
          }}
        >
          ×
        </button>
      </div>

      {manualOpen ? (
        <div className="pwa-install-manual" role="dialog" aria-modal="true">
          <button type="button" className="pwa-install-manual-backdrop" onClick={() => setManualOpen(false)} aria-label="Fechar" />
          <div className="pwa-install-manual-card">
            <h3>Instalar no Android</h3>
            <ol>
              <li>Abra no Chrome do telemóvel.</li>
              <li>Toque no menu ⋮ (canto superior direito).</li>
              <li>Escolha <strong>Instalar app</strong> ou <strong>Adicionar ao ecrã principal</strong>.</li>
            </ol>
            <button type="button" className="pwa-install-cta" onClick={() => setManualOpen(false)}>
              Entendi
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}

async function triggerInstall(
  promptEvent: BeforeInstallPromptEvent,
  setDeferred: (ev: BeforeInstallPromptEvent | null) => void,
) {
  await promptEvent.prompt()
  await promptEvent.userChoice
  setDeferred(null)
}
