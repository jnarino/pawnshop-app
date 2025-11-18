import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import svgr from 'vite-plugin-svgr'

export default defineConfig({
  plugins: [
    react(),
    svgr(),
  ],
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
            // ✅ Safe access to both options.target and req.url with fallbacks
            const target = options.target || 'http://localhost:3000';
            const url = req.url || '/unknown';
            const method = req.method || 'GET';
            console.log('📤 Proxying:', method, url, '→', target + url);
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
