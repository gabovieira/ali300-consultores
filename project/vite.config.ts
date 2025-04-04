import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
    hmr: {
      overlay: false,
    },
    middlewareMode: false,
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/firestore', 'firebase/auth'],
        },
      },
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'firebase/app',
      'firebase/firestore',
      'firebase/auth',
    ],
  },
  clearScreen: false,
  logLevel: 'error',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
