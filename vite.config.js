import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Element Quest',
        short_name: 'Element Quest',
        description: 'Periodic table memory game for kids and parents',
        theme_color: '#070b14',
        background_color: '#070b14',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/icon.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: '/icon.svg', sizes: '512x512', type: 'image/svg+xml' },
          { src: '/icon.svg', sizes: 'any',     type: 'image/svg+xml', purpose: 'maskable any' },
        ],
      },
    }),
  ],
})
