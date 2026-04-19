import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 8080,
    fs: {
      // Allow Vite to serve the compiled browser SDK from the monorepo root
      allow: ['../../']
    }
  },
  resolve: {
    // Force usewebmcp to use the exact same React instance as our app
    dedupe: ['react', 'react-dom']
  }
});