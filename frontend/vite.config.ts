import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@services': path.resolve(__dirname, './src/services'),
      '@contexts': path.resolve(__dirname, './src/contexts'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@styles': path.resolve(__dirname, './src/styles'),
      '@types': path.resolve(__dirname, './src/types'),
      '@mocks': path.resolve(__dirname, './src/mocks'),
    },
  },
  build: {
    target: 'esnext',
    minify: false,
    rollupOptions: {
      output: [
        {
          entryFileNames: 'js/[name]-[hash].js',
          chunkFileNames: 'js/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            const filename = assetInfo.name || ''
            const ext = filename.split('.').pop() || ''
            if (/png|jpe?g|gif|svg|webp/.test(ext)) {
              return `images/[name]-[hash][extname]`
            }
            if (['woff', 'woff2', 'eot', 'ttf', 'otf'].includes(ext)) {
              return `fonts/[name]-[hash][extname]`
            }
            return `[name]-[hash][extname]`
          },
        },
      ],
    },
    reportCompressedSize: true,
    sourcemap: process.env.NODE_ENV === 'development',
  },
  server: {
    port: 4173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
