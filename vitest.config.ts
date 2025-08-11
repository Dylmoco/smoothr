import { defineConfig } from 'vitest/config';
import path from 'node:path';

// Resolve repo root based on this config file location
const repoRoot = __dirname;

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts', 'storefronts/tests/setup/supabaseMock.ts'],
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': path.resolve(repoRoot, 'smoothr'),
      '@/lib/findOrCreateCustomer': path.resolve(
        repoRoot,
        'shared/lib/findOrCreateCustomer.ts'
      ),
      // Admin/server shared code referenced by storefront tests
      shared: path.resolve(repoRoot, 'shared'),
      'shared/*': path.resolve(repoRoot, 'shared'),
      // Optional: if any tests import admin app files by alias later
      smoothr: path.resolve(repoRoot, 'smoothr'),
      'smoothr/*': path.resolve(repoRoot, 'smoothr'),
    },
  },
});
