import { defineConfig } from 'vite'
import svgr from 'vite-plugin-svgr'
import react from '@vitejs/plugin-react'
import * as path from 'path'

export default defineConfig({
  publicDir: 'public',
  plugins: [
    react(),
    svgr({
      // Опции SVGR
      svgrOptions: {
        exportType: 'default',
        ref: true,
        svgo: false,
        titleProp: true,
        icon: true,
      },
      include: '**/*.svg?react',
      exclude: '',
    }),
  ],
  css: {
    modules: {
      generateScopedName: '[name]__[local]__[hash:base64:5]',
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@data': path.resolve(__dirname, './src/data'),
      '@i18n': path.resolve(__dirname, './src/i18n'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@router': path.resolve(__dirname, './src/router'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@models': path.resolve(__dirname, './src/types'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@providers': path.resolve(__dirname, './src/providers'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@styles': path.resolve(__dirname, './src/styles'),
    }
  },
  server: {
    port: 3000,
    open: true
  },
  build: {
    // =================== ОСНОВНЫЕ НАСТРОЙКИ BUILD ===================
    outDir: 'build',
    assetsDir: 'assets',
    sourcemap: false,
    target: 'ES2022',
    emptyOutDir: true,

    // =================== РАЗМЕРЫ И ПРЕДУПРЕЖДЕНИЯ ===================
    chunkSizeWarningLimit: 500,
    reportCompressedSize: true,

    // =================== CSS И СТАТИКА ===================
    cssCodeSplit: true,
    cssMinify: true,
    manifest: false,

    // =================== МИНИФИКАЦИЯ ===================
    minify: 'esbuild', // 'esbuild' | 'terser' | false

    // =================== ROLLUP НАСТРОЙКИ ===================
    rollupOptions: {
      output: {
        // Именование файлов
        entryFileNames: 'js/[name]-[hash].js',
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const extType = assetInfo.name?.split('.').pop() || ''
          if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(extType)) {
            return 'images/[name]-[hash][extname]'
          }
          if (extType === 'css') {
            return 'css/[name]-[hash][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        },

        // Разделение чанков
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          i18n: ['i18next', 'react-i18next'],
          // utils: ['gray-matter', 'remark', 'remark-gfm']
        }
      }
    }
  },

  // =================== ESBUILD НАСТРОЙКИ (НА ВЕРХНЕМ УРОВНЕ!) ===================
  esbuild: {
    // Удаление кода
    // drop: ['console', 'debugger'],

    // JSX
    jsx: 'automatic',
    jsxDev: false,

    // Define - замены времени сборки
    define: {
      'process.env.NODE_ENV': '"production"',
      '__DEV__': 'false',
      '__VERSION__': '"1.0.0"'
    },

    // Поддержка функций
    supported: {
      'dynamic-import': true,
      'import-meta': true,
      'bigint': true,
      'top-level-await': true
    },

    // Комментарии
    legalComments: 'none'
  }
})
