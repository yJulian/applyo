import cryptoModule, { webcrypto } from 'crypto';

const polyfilledCrypto = {
  ...webcrypto,
  randomUUID: cryptoModule.randomUUID?.bind(cryptoModule) || webcrypto?.randomUUID?.bind(webcrypto),
  getRandomValues: <T extends ArrayBufferView | null>(array: T): T => webcrypto.getRandomValues(array as any) as any,
};

if (typeof globalThis.crypto === 'undefined' || !globalThis.crypto.randomUUID) {
  (globalThis as any).crypto = polyfilledCrypto;
}
if (typeof (global as any).crypto === 'undefined' || !(global as any).crypto.randomUUID) {
  (global as any).crypto = polyfilledCrypto;
}

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  base: './',
  server: {
    proxy: {
      '/kit-api': {
        target: 'https://ki-toolbox.scc.kit.edu',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/kit-api/, ''),
        secure: false,
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Applyo - AI Job Application PWA Manager',
        short_name: 'Applyo',
        description: 'Verwalte deine Bewerbungen mit KI-Unterstützung und lokaler Dateisystem-Integration',
        theme_color: '#090d16',
        background_color: '#090d16',
        display: 'standalone',
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
        ],
      },
    }),
  ],
  build: {
    minify: 'esbuild',
  },
});
