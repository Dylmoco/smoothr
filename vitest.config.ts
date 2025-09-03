// Root keeps shared setup (globals/shims), but does NOT force environment/transform.
// Each workspace still controls jsdom/transform/deps in its own config.
import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  test: {
    // These setup files existed before and are needed by many SDK tests.
    // If a path does not exist in this repo, skip that entry gracefully.
    setupFiles: [
      './vitest.setup.ts',
      './storefronts/tests/setup.ts'
    ].filter(Boolean)
  },
  resolve: {
    alias: {
      // mirror storefronts workspace aliases so root runs behave the same
      'shared/': fileURLToPath(new URL('./shared/', import.meta.url)),
      'smoothr/': fileURLToPath(new URL('./smoothr/', import.meta.url)),
      'storefronts/': fileURLToPath(new URL('./storefronts/', import.meta.url))
    }
  }
});

