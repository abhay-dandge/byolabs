import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const proxyConfig = {
  '/api': {
    target: 'http://localhost:4000',
    changeOrigin: true,
    ws: true,
  },
  '/proxy': {
    target: 'http://localhost:4000',
    changeOrigin: true,
    ws: true,
  },
};

export default defineConfig({
  plugins: [react()],
  envDir: path.resolve(__dirname, '../../'),
  server: {
    port: 5173,
    allowedHosts: true,
    proxy: proxyConfig,
  },
  preview: {
    port: 3000,
    allowedHosts: true,
    proxy: proxyConfig,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
