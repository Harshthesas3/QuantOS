import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function wasmRequirePlugin() {
  return {
    name: 'vite-plugin-wasm-require',
    resolveId(id) {
      if (id.endsWith('.wasm')) {
        return { id, external: false }
      }
    },
    load(id) {
      if (id.endsWith('.wasm')) {
        return `export default new URL(${JSON.stringify(id)}, import.meta.url).href`
      }
    },
  }
}

export default defineConfig({
  base: './',
  plugins: [react(), wasmRequirePlugin()],
  server: {
    port: 5176,
  },
  build: {
    rollupOptions: {
      external: ['node:fs', 'node:path'],
    },
    // Keep the sql.js WASM asset as a separate file so sql.js can locate it.
    assetsInlineLimit: 0,
  },
  optimizeDeps: {
    exclude: ['sql.js'],
  },
})
