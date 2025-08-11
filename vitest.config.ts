import { defineConfig } from 'vitest/config';
import path from 'node:path';

const repoRoot = __dirname;

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    testTimeout: 10000,
    deps: {
      inline: ['@supabase/supabase-js'], // Enable npm imports
      resolver: 'node', // Force Node resolver for npm packages
    },
    resolve: {
      conditions: ['module'], // Ensure ES module resolution
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(repoRoot, 'smoothr'),
      '@/lib/findOrCreateCustomer': path.resolve(repoRoot, 'shared/lib/findOrCreateCustomer.ts'),
      shared: path.resolve(repoRoot, 'shared'),
      'shared/*': path.resolve(repoRoot, 'shared'),
      smoothr: path.resolve(repoRoot, 'smoothr'),
      'smoothr/*': path.resolve(repoRoot, 'smoothr'),
    },
  },
});