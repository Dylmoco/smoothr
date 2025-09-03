import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    // Helps when mocking ESM deps
    deps: {
      inline: ['@supabase/supabase-js'],
    },
  },
  esbuild: {
    // keep ESM semantics for tests
    format: 'esm',
    target: 'es2020',
  },
});
