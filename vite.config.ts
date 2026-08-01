import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      external: ['better-sqlite3', 'argon2-browser', 'node:fs', 'node:path'],
    },
  },
})