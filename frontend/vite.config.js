import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    proxy: {
      '/auth': 'http://backend:4000',
      '/api': 'http://backend:4000',
    },
    allowedHosts: ['53555798417d.ngrok-free.app']
  }
});
