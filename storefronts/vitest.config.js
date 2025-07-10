import { defineConfig } from 'vitest/config';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: 'happy-dom',
    setupFiles: './vitest.setup.js'
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '../apps/admin-dashboard')
    }
  }
});
