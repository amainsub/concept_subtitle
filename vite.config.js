import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom', // Lighter and faster than jsdom for pure logic tests
  },
  server: {
    port: 5173,
    host: true, // Allow external connections
    headers: {
      'Cache-Control': 'public, max-age=31536000', // Cache static files for 1 year
    },
  },
});
