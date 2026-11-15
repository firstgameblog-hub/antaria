import { defineConfig } from 'vite'

// base: './' — чтобы собранная игра открывалась и с подпапки (GitHub Pages), и локально.
export default defineConfig({
  base: './',
  server: {
    port: 5173,
    strictPort: true,
    open: false,
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
    sourcemap: true,
  },
})
