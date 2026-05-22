import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        // En Docker usa el nombre del servicio; en local usa localhost
        target: process.env.API_TARGET || 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
