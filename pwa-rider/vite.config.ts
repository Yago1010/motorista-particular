import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Backend Laravel: Docker web em 8080 (docker-compose) ou PHP embutido em 8888 (run-local.ps1).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_PROXY_TARGET || 'http://localhost:8080'

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/user': { target: proxyTarget, changeOrigin: true },
        '/provider': { target: proxyTarget, changeOrigin: true },
        '/server': { target: proxyTarget, changeOrigin: true },
      },
    },
  }
})
