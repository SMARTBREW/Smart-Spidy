import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // This makes all asset paths relative instead of absolute
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
