import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['tests/sdk/signup-dist.test.js'],
    setupFiles: ['tests/sdk/setup-dist.ts'],
    isolate: true,
    testTimeout: 30000,
  },
});
