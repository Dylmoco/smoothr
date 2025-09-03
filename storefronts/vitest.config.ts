import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// Ensure the project root for Vitest is the storefronts workspace,
// not the monorepo root (important for package.json `type` resolution).
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const wsRoot = resolve(__dirname, '.');

export default defineConfig({
  root: wsRoot,

  // Keep ESM semantics for tests (avoid SSR/script transform on tests)
  test: {
    environment: 'jsdom',
    globals: true,
    isolate: true,
    threads: false, // simplify env for jsdom + ESM
    // Force Vite to treat our tests as web code (ESM), not SSR.
    transformMode: {
      web: [/\.(m?[jt]sx?)$/],
      ssr: [/node_modules/], // only SSR-transform node_modules when required
    },
    deps: {
      // Inline ESM deps so Vite transforms them instead of Node requiring them as CJS
      inline: [
        /@supabase\/supabase-js/,
      ],
    },
    // Helpful for diagnosing first failure file; you can toggle to 'verbose'
    reporters: ['default'],
  },

  // Prefer ESM/browser entry points
  resolve: {
    conditions: ['browser', 'module', 'import', 'default'],
  },

  // Ensure TS/JS transpile target matches our ESM usage
  esbuild: {
    target: 'es2020',
    format: 'esm',
  },

  // Useful defines for modules that branch on NODE_ENV
  define: {
    'process.env.NODE_ENV': JSON.stringify('test'),
  },
});
