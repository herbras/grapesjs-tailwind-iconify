import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const configs = {
    main: {
      entry: 'src/index.js',
      name: 'GrapesjsTailwind',
      fileName: 'grapesjs-tailwind-cdn.min.js'
    },
    manager: {
      entry: 'src/custom-component-manager.js',
      name: 'CustomComponentManager',
      fileName: 'custom-component-manager.min.js'
    }
  };

  const config = configs[mode] || configs.main;

  return {
    build: {
      outDir: 'dist/cdn',
      lib: {
        entry: resolve(__dirname, config.entry),
        name: config.name,
        formats: ['umd'],
        fileName: () => config.fileName
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
      sourcemap: false,
      emptyOutDir: false
    },
    define: {
      'process.env.NODE_ENV': '"production"'
    }
  };
}); 