import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const API_TARGET = 'http://localhost:3001'

const apiProxy = {
  target: API_TARGET,
  changeOrigin: true,
  secure: false,
  timeout: 0,
  proxyTimeout: 0,
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      // Teachers API - multipart/form-data (photo upload)
      '/api/v1/teachers': {
        target: API_TARGET,
        changeOrigin: true,
        secure: false,
        timeout: 0,
        proxyTimeout: 0,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            const cl = req.headers['content-length']
            if (cl) {
              proxyReq.setHeader('content-length', cl)
            }
            proxyReq.removeHeader('transfer-encoding')
          })

          proxy.on('proxyRes', (proxyRes) => {
            proxyRes.headers['access-control-allow-origin'] = '*'
          })

          proxy.on('error', (err, _req, res) => {
            console.error('[teachers API proxy error]', err.code, err.message)
            if (res && !res.headersSent) {
              res.writeHead(502, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ message: `Proxy xato: ${err.message}` }))
            }
          })
        },
      },

      // Students API - multipart/form-data (photo upload)
      '/api/v1/students': {
        target: API_TARGET,
        changeOrigin: true,
        secure: false,
        timeout: 0,
        proxyTimeout: 0,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            const cl = req.headers['content-length']
            if (cl) {
              proxyReq.setHeader('content-length', cl)
            }
            proxyReq.removeHeader('transfer-encoding')
          })

          proxy.on('proxyRes', (proxyRes) => {
            proxyRes.headers['access-control-allow-origin'] = '*'
          })

          proxy.on('error', (err, _req, res) => {
            console.error('[students API proxy error]', err.code, err.message)
            if (res && !res.headersSent) {
              res.writeHead(502, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ message: `Proxy xato: ${err.message}` }))
            }
          })
        },
      },

      // Homework upload proxy — katta fayllar uchun alohida sozlamalar
      '/api/v1/students/homeworkAnswer': {
        target: API_TARGET,
        changeOrigin: true,
        secure: false,
        timeout: 0,
        proxyTimeout: 0,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            // Content-Length ni o'zgartirishsiz yuborish
            const cl = req.headers['content-length']
            if (cl) {
              proxyReq.setHeader('content-length', cl)
            }
            // Transfer-Encoding chunked ni olib tashlash
            proxyReq.removeHeader('transfer-encoding')
          })

          // Katta javob uchun
          proxy.on('proxyRes', (proxyRes) => {
            proxyRes.headers['access-control-allow-origin'] = '*'
          })

          proxy.on('error', (err, _req, res) => {
            console.error('[homework upload proxy error]', err.code, err.message)
            if (res && !res.headersSent) {
              res.writeHead(502, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ message: `Proxy xato: ${err.message}` }))
            }
          })
        },
      },

      // Upload proxy — alohida, buffer va timeout sozlamalari bilan
      '/api/v1/files/group': {
        target: API_TARGET,
        changeOrigin: true,
        secure: false,
        timeout: 0,
        proxyTimeout: 0,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            // Content-Length ni o'zgartirishsiz yuborish
            const cl = req.headers['content-length']
            if (cl) {
              proxyReq.setHeader('content-length', cl)
            }
            // Transfer-Encoding chunked ni olib tashlash
            proxyReq.removeHeader('transfer-encoding')
          })

          // Katta javob uchun
          proxy.on('proxyRes', (proxyRes) => {
            proxyRes.headers['access-control-allow-origin'] = '*'
          })

          proxy.on('error', (err, _req, res) => {
            console.error('[upload proxy error]', err.code, err.message)
            if (res && !res.headersSent) {
              res.writeHead(502, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ message: `Proxy xato: ${err.message}` }))
            }
          })
        },
      },

      // Oddiy API proxy
      '/api/v1': apiProxy,
      '/uploads': { ...apiProxy },
      '/files/videos': { ...apiProxy },
    },
  },
  preview: {
    proxy: {
      '/api/v1/teachers': {
        target: API_TARGET,
        changeOrigin: true,
        secure: false,
        timeout: 0,
        proxyTimeout: 0,
      },
      '/api/v1/students': {
        target: API_TARGET,
        changeOrigin: true,
        secure: false,
        timeout: 0,
        proxyTimeout: 0,
      },
      '/api/v1/students/homeworkAnswer': {
        target: API_TARGET,
        changeOrigin: true,
        secure: false,
        timeout: 0,
        proxyTimeout: 0,
      },
      '/api/v1/files/group': {
        target: API_TARGET,
        changeOrigin: true,
        secure: false,
        timeout: 0,
        proxyTimeout: 0,
      },
      '/api/v1': apiProxy,
      '/uploads': { ...apiProxy },
    },
  },
})
