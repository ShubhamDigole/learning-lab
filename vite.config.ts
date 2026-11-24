import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { createReadStream, existsSync, mkdirSync, copyFileSync } from 'node:fs'
import { join } from 'node:path'

// Pyodide (real Python in WebAssembly) is served from /pyodide/ so the Python lab works offline.
const PYODIDE_DIR = join(process.cwd(), 'node_modules', 'pyodide')
const PYODIDE_FILES = ['pyodide.asm.mjs', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json', 'pyodide.mjs']
function pyodideAssets(): Plugin {
  return {
    name: 'pyodide-assets',
    configureServer(server) {
      server.middlewares.use('/pyodide', (req, res, next) => {
        const file = (req.url ?? '').split('?')[0].replace(/^\//, '')
        if (!PYODIDE_FILES.includes(file)) return next()
        const type = file.endsWith('.wasm') ? 'application/wasm' : file.endsWith('.mjs') ? 'text/javascript' : file.endsWith('.json') ? 'application/json' : 'application/zip'
        res.setHeader('Content-Type', type)
        createReadStream(join(PYODIDE_DIR, file)).pipe(res)
      })
    },
    writeBundle(opts) {
      const out = join(opts.dir ?? 'dist', 'pyodide')
      if (!existsSync(out)) mkdirSync(out, { recursive: true })
      for (const f of PYODIDE_FILES) copyFileSync(join(PYODIDE_DIR, f), join(out, f))
    },
  }
}

export default defineConfig({
  plugins: [react(), pyodideAssets()],
  optimizeDeps: { exclude: ['@electric-sql/pglite', 'pyodide'] },
  worker: { format: 'es' },
})
