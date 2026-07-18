import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  optimizeDeps: {
    include: ['react', 'react-dom/client'],
  },
  server: {
    host: '0.0.0.0',
    allowedHosts: ['terminal.local', 'localhost'],
    warmup: {
      clientFiles: ['./src/main.jsx'],
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon-48x48.png',
        'apple-touch-icon-180x180.png',
        'assets/demo-oat-carton.webp',
        'assets/paper-texture.webp',
      ],
      manifest: {
        name: 'Lupa — Entiende tus productos',
        short_name: 'Lupa',
        description:
          'Escanea un producto y entiende qué datos hay, qué falta y por qué importa.',
        lang: 'es',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait-primary',
        background_color: '#f2ebdd',
        theme_color: '#f2ebdd',
        categories: ['food', 'health', 'lifestyle', 'utilities'],
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Escanear producto',
            short_name: 'Escanear',
            description: 'Abre Lupa para escanear un producto.',
            url: './',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }],
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        navigateFallback: 'index.html',
        globPatterns: ['**/*.{js,css,html,ico,png,webp,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/images\.openfoodfacts\.org\//i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'lupa-product-images',
              expiration: {
                maxEntries: 40,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
});
