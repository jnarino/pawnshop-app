import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import svgr from 'vite-plugin-svgr'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiUrl = env.VITE_API_URL || 'http://localhost:3000'

  return {
    base: './',
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
          target: apiUrl,
          changeOrigin: true,
          secure: false,
          timeout: 10000,
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              console.log('🔴 Proxy error:', err.message);
              console.log(`🔍 Check if server is running on ${apiUrl}`);
            });
            proxy.on('proxyReq', (proxyReq, req, res) => {
              const target = options.target || apiUrl;
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
  }
})
