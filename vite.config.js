import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'GrapesjsTailwind',
      formats: ['es', 'umd'],
      fileName: (format) => `grapesjs-tailwind.${format === 'es' ? 'esm' : 'min'}.js`
    },
    rollupOptions: {
      external: ['grapesjs'],
      output: {
        globals: {
          grapesjs: 'grapesjs'
        }
      }
    },
    minify: 'terser',
    sourcemap: true
  },
  server: {
    port: 3000,
    open: '/example-custom-components.html'
  },
  define: {
    'process.env.NODE_ENV': '"production"'
  }
}); 