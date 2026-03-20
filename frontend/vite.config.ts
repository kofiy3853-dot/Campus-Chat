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
    target: 'es2015',
    cssTarget: 'safari12',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-utils': ['axios', 'clsx', 'lucide-react'],
        },
      },
    },
  },
  server: {
    host: true,
    proxy: {
      '/api': 'http://localhost:6000',
      '/uploads': 'http://localhost:6000',
      '/socket.io': {
        target: 'http://localhost:6000',
        ws: true,
      },
    },
  },
})
