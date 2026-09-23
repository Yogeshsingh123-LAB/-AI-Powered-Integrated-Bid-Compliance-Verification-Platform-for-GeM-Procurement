import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    // Dev-only: allow the sandbox preview host (and localhost). Production
    // serves the static build, so this never applies there.
    allowedHosts: ['localhost', '127.0.0.1', '.e2b.app'],
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://127.0.0.1:8000',
        changeOrigin: true,
        ws: true,
        secure: false,
      }
    }
  }
})
