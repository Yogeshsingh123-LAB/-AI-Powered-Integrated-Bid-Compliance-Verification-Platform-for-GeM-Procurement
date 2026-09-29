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
      // Mirror vercel.json's rewrites so the dev server behaves like the
      // deployment: these paths must reach the FastAPI app, not fall through
      // to the SPA catch-all. More specific paths come first.
      '/openapi.json': {
        target: process.env.VITE_API_URL || 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
      '/docs': {
        target: process.env.VITE_API_URL || 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
      '/health': {
        target: process.env.VITE_API_URL || 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: process.env.VITE_API_URL || 'http://127.0.0.1:8000',
        changeOrigin: true,
        ws: true,
        secure: false,
      },
    },
  }
})
