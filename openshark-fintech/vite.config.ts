import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3030,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env.API_URL': JSON.stringify(env.API_URL || 'http://localhost:8001'),
      'process.env.WS_URL': JSON.stringify(env.WS_URL || 'ws://localhost:8002'),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
