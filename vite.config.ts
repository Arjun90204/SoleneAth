import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    // Listen on the local network, not just localhost, so the dev server
    // is reachable from a phone on the same Wi-Fi during development.
    host: true,
  },
});
