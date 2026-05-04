import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [
    react(),
    basicSsl(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Karbure - Comparateur de Prix Carburant',
        short_name: 'Karbure',
        description: 'Trouvez le carburant le moins cher près de chez vous en temps réel',
        theme_color: '#FF6B00',
        background_color: '#080810',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        lang: 'fr-FR',
        categories: ['utilities', 'lifestyle'],
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/data\.economie\.gouv\.fr\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 300
              }
            }
          },
          {
            urlPattern: /^https:\/\/.+\.(png|jpg|jpeg|svg|gif)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 604800
              }
            }
          }
        ]
      }
    })
  ],

  server: {
    host: '0.0.0.0',   // ✅ accessible sur tout le réseau
    port: 5173,        // ✅ port personnalisé
    https: true,      // ✅ SSL pour développement local
    open: 'http://localhost:5173',
    hmr: {
      protocol: 'wss',
      host: 'localhost',
      port: 5173,
      timeout: 60000
    }
  },

  build: {
    target: 'esnext',
    minify: 'terser'
  }
})
