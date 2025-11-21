import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  },
  // Comentado temporalmente - causa problemas con Supabase
  // server: {
  //   headers: {
  //     'Cross-Origin-Opener-Policy': 'same-origin',
  //     'Cross-Origin-Embedder-Policy': 'credentialless',
  //   },
  // },
  // preview: {
  //   headers: {
  //     'Cross-Origin-Opener-Policy': 'same-origin',
  //     'Cross-Origin-Embedder-Policy': 'credentialless',
  //   },
  // },
})
