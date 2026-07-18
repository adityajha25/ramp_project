import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { handleParseTripRequest } from './api/_lib/parseTripWithOpenAI.js';

function parseTripApiPlugin(apiKey) {
  return {
    name: 'parse-trip-api',
    configureServer(server) {
      server.middlewares.use('/api/parse-trip', (req, res, next) => {
        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        if (req.method !== 'POST') {
          next();
          return;
        }

        handleParseTripRequest(req, res, apiKey).catch((error) => {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: error?.message || 'Server error' }));
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            mapbox: ['mapbox-gl'],
            vendor: ['react', 'react-dom'],
          },
        },
      },
    },
    plugins: [
      react(),
      parseTripApiPlugin(env.OPENAI_API_KEY),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'icons/*.png', 'logo.png'],
        manifest: {
          name: 'OneRide — MoveNYC',
          short_name: 'OneRide',
          description: 'Compare Uber, Lyft, Empower, and NYC taxi prices in one place.',
          theme_color: '#0f172a',
          background_color: '#0f172a',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: 'icons/icon-180.png',
              sizes: '180x180',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'icons/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'icons/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'icons/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        },
      }),
    ],
  };
});
