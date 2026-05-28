import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom', // Lighter and faster than jsdom for pure logic tests
  },
  server: {
    port: 5173,
    host: '0.0.0.0', // Listen on all network interfaces
    strictPort: false,
    hmr: {
      // Force WSS for ngrok HTTPS tunnels
      protocol: 'wss',
      host: 'ktsample.ngrok.io',
      clientPort: 443,
    },
    cors: {
      origin: '*', // Allow all origins
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['*'],
      credentials: true,
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Cross-Origin-Resource-Policy': 'cross-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
  },
});
