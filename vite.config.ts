import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    port: 5175,
    // Allow Cloudflare/ngrok tunnel hosts during local development.
    allowedHosts: true,
    proxy: {
      // API JSON + Sanctum.
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      // Public uploads (avatars, logos, chat attachments). Same-origin so
      // Telegram tunnels / LAN devices don't try to fetch 127.0.0.1.
      '/storage': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
