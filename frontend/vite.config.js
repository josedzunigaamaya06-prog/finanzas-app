import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.svg', 'pwa-192.svg', 'pwa-512.svg'],
      manifest: {
        name: 'FinanzasPro',
        short_name: 'FinanzasPro',
        description: 'Tu aliado para tomar control de tus finanzas personales',
        theme_color: '#6366f1',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        lang: 'es',
        icons: [
          {
            src: 'pwa-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'pwa-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        // Cachear assets estáticos
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
        // Estrategia: red primero, caché como respaldo
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 }, // 5 min
              networkTimeoutSeconds: 10,
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: process.env.API_TARGET || 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
