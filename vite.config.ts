import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// base './' so the built folder works under any sub-path (GitHub Pages project page, a preview server, a demo URL).
export default defineConfig({
  plugins: [vue()],
  base: './',
  build: { target: 'es2020', assetsInlineLimit: 0, chunkSizeWarningLimit: 600 },
  server: { host: true },
})
