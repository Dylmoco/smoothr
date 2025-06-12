import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: path.resolve(__dirname, 'core/index.js'),
      output: {
        dir: 'dist',
        format: 'es'
      }
    },
    target: 'esnext',
    emptyOutDir: true
  }
});
