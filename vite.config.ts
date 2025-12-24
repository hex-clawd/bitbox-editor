import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

const isProto = process.env.UI_PROTO === '1'

export default defineConfig({
  plugins: isProto ? [] : [react()],
  root: isProto ? resolve(__dirname, 'ui_prototype') : undefined,
  build: {
    outDir: isProto ? resolve(__dirname, 'dist-proto') : 'dist',
    emptyOutDir: true
  },
  server: {
    port: 1420,
    strictPort: true
  }
})
