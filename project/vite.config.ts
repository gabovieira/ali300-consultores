import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    },
    dedupe: ['react', 'react-dom', 'lucide-react']
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'lucide-icons': ['lucide-react']
        }
      }
    }
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true
  },
  preview: {
    port: 4173
  }
});
