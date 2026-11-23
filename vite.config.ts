import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'

// Preload the Latin UI font so the title is laid out once in Archivo instead of jumping when it arrives.
function preloadFont(name: string): Plugin {
  return {
    name: 'preload-font',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        const file = Object.keys(ctx.bundle ?? {}).find((f) => f.includes(name) && f.endsWith('.woff2'))
        if (!file) return []
        return [{ tag: 'link', attrs: { rel: 'preload', as: 'font', type: 'font/woff2', href: './' + file, crossorigin: '' }, injectTo: 'head' }]
      },
    },
  }
}

// base './' so the built folder works under any sub-path (GitHub Pages project page, a preview server, a demo URL).
export default defineConfig({
  plugins: [vue(), preloadFont('archivo')],
  base: './',
  build: { target: 'es2020', assetsInlineLimit: 0, chunkSizeWarningLimit: 600 },
  server: { host: true },
})
