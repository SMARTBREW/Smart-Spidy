import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // This makes all asset paths relative instead of absolute
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    chunkSizeWarningLimit: 1000, // Increase warning limit to 1000 kB
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks for third-party libraries
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('react-router')) {
              return 'vendor-router';
            }
            if (id.includes('framer-motion') || id.includes('lucide-react')) {
              return 'vendor-ui';
            }
            if (id.includes('date-fns')) {
              return 'vendor-utils';
            }
            return 'vendor';
          }
          
          // Feature-based chunks
          if (id.includes('/admin/')) {
            return 'admin';
          }
          if (id.includes('/components/Chat') || id.includes('/hooks/useChat')) {
            return 'chat';
          }
          if (id.includes('/components/Login') || id.includes('/components/Protected') || id.includes('/services/auth')) {
            return 'auth';
          }
        }
      }
    }
  }
});
