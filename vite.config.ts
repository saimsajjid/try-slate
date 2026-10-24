import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import fs from 'fs'
import path from 'path'

function academicFilesPlugin(): Plugin {
  const academicsBase = path.resolve(__dirname, '../Academics')
  return {
    name: 'academic-files-server',
    configureServer(server) {
      server.middlewares.use('/academic-files', (req, res, next) => {
        try {
          const rawUrl = req.url || '/'
          const decodedPath = decodeURIComponent(rawUrl.split('?')[0])
          const fullPath = path.resolve(academicsBase, '.' + decodedPath)

          // Security check: ensure path stays within academicsBase
          if (!fullPath.startsWith(academicsBase)) {
            res.statusCode = 403
            res.end('Access denied')
            return
          }

          if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
            res.statusCode = 404
            res.end('File not found')
            return
          }

          const stat = fs.statSync(fullPath)
          const ext = path.extname(fullPath).toLowerCase()
          const mimeTypes: Record<string, string> = {
            '.pdf': 'application/pdf',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.doc': 'application/msword',
            '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            '.ppsx': 'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
            '.ppt': 'application/vnd.ms-powerpoint',
            '.jpeg': 'image/jpeg',
            '.jpg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.webp': 'image/webp',
            '.md': 'text/markdown; charset=utf-8',
            '.txt': 'text/plain; charset=utf-8',
            '.py': 'text/plain; charset=utf-8',
            '.json': 'application/json',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.mp3': 'audio/mpeg',
          }

          const contentType = mimeTypes[ext] || 'application/octet-stream'
          res.setHeader('Content-Type', contentType)
          res.setHeader('Access-Control-Allow-Origin', '*')

          const range = req.headers.range
          if (range) {
            const parts = range.replace(/bytes=/, '').split('-')
            const start = parseInt(parts[0], 10)
            const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1
            const chunksize = end - start + 1
            res.statusCode = 206
            res.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`)
            res.setHeader('Accept-Ranges', 'bytes')
            res.setHeader('Content-Length', chunksize)
            fs.createReadStream(fullPath, { start, end }).pipe(res)
          } else {
            res.statusCode = 200
            res.setHeader('Content-Length', stat.size)
            res.setHeader('Content-Disposition', 'inline')
            fs.createReadStream(fullPath).pipe(res)
          }
        } catch (err) {
          next(err)
        }
      })

      // IDM-Immune Obfuscated Binary Preview Stream (No file extensions in URL)
      server.middlewares.use('/api/doc-stream', (req, res, next) => {
        try {
          const rawUrl = req.url || '/'
          const urlObj = new URL(rawUrl, 'http://localhost')
          const docParam = urlObj.searchParams.get('doc')
          if (!docParam) {
            res.statusCode = 400
            res.end('Missing doc parameter')
            return
          }

          let relativePath = Buffer.from(docParam, 'base64').toString('utf-8')
          if (relativePath.startsWith('/academic-files/')) {
            relativePath = relativePath.replace('/academic-files/', '')
          }
          if (relativePath.startsWith('/')) {
            relativePath = relativePath.slice(1)
          }

          const fullPath = path.resolve(academicsBase, relativePath)
          if (!fullPath.startsWith(academicsBase) || !fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
            res.statusCode = 404
            res.end('File not found')
            return
          }

          const stat = fs.statSync(fullPath)
          res.setHeader('Content-Type', 'application/x-slate-preview')
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Content-Disposition', 'inline')
          res.setHeader('X-Content-Type-Options', 'nosniff')
          res.setHeader('Content-Length', stat.size)
          res.statusCode = 200
          fs.createReadStream(fullPath).pipe(res)
        } catch (err) {
          next(err)
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), academicFilesPlugin()],
  server: {
    port: 5173,
    host: true,
    fs: {
      allow: ['..'],
    },
  },
})
