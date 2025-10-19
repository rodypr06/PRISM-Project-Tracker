import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: [
      'prism.rodytech.net',
      '.rodytech.net', // Allow all subdomains
      'localhost',
      '192.168.50.136',
    ],
    proxy: {
      '/api': {
        target: 'http://192.168.50.136:5000',
        changeOrigin: true,
      },
    },
  },
})
