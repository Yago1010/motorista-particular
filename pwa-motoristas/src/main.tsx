import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// Service Worker registration
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/pwa-motoristas/sw.js')
    .then(reg => console.log('SW registered:', reg))
    .catch(err => console.log('SW registration failed:', err))
}

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)