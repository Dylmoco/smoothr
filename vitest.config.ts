import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'smoothr'),
      '@/lib/findOrCreateCustomer': resolve(
        __dirname,
        'shared/lib/findOrCreateCustomer.ts'
      ),
    },
  },
});
