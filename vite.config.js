import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const API_TARGET = 'https://najot-edu.softwareengineer.uz'

const apiProxy = {
  target: API_TARGET,
  changeOrigin: true,
  secure: true,
  timeout: 600000,
  proxyTimeout: 600000,
}

const uploadProxy = {
  target: API_TARGET,
  changeOrigin: true,
  secure: true,
  timeout: 0,
  proxyTimeout: 0,
  configure: (proxy) => {
    // http-proxy buffer limitini o'chirish
    proxy.on('proxyReq', (proxyReq, req) => {
      // Transfer-Encoding: chunked — buffer qilmasdan stream sifatida yuborish
      proxyReq.removeHeader('content-length')
      proxyReq.setHeader('transfer-encoding', 'chunked')
    })
    proxy.on('error', (err, _req, res) => {
      console.error('[upload proxy]', err.code, err.message)
      if (res && !res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ message: err.message }))
      }
    })
  },
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      '/api/v1/files/group': uploadProxy,
      '/api/v1': apiProxy,
      '/uploads': { ...apiProxy },
    },
  },
  preview: {
    proxy: {
      '/api/v1/files/group': uploadProxy,
      '/api/v1': apiProxy,
      '/uploads': { ...apiProxy },
    },
  },
})
