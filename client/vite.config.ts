import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'app': path.resolve(__dirname, './src/app'),
      'core': path.resolve(__dirname, './src/app/core'),
      'feature': path.resolve(__dirname, './src/app/feature'),
      'shared': path.resolve(__dirname, './src/app/shared')
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // ✅ Make sure this matches your server port
        changeOrigin: true,
        secure: false,
        timeout: 10000, // 10 second timeout
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('🔴 Proxy error:', err.message);
            console.log('🔍 Check if server is running on http://localhost:3000');
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('📤 Proxying:', req.method, req.url, '→', options.target + req.url);
          });
        }
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
