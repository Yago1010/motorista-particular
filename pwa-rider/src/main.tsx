import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import 'leaflet/dist/leaflet.css'
import './assets/main.css'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swPath = window.location.pathname.startsWith('/pwa-rider')
      ? '/pwa-rider/sw.js'
      : '/sw.js'
    const scope = window.location.pathname.startsWith('/pwa-rider') ? '/pwa-rider/' : '/'
    navigator.serviceWorker.register(swPath, { scope }).catch(() => {})
  })
}

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
