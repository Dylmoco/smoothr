import { defineConfig } from 'vitest/config';
import path from 'node:path';
import url from 'node:url';

// Resolve a path relative to THIS config file (storefronts/)
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const r = (p: string) => path.resolve(__dirname, p);

let config;

try {
  const setupFiles = [
    r('../vitest.setup.ts'),
    r('./tests/setup.ts'),
    r('./tests/vitest-config-log.ts'),
  ];
  console.log('vitest.config.ts setupFiles loaded', setupFiles);

  // Map "shared/..." to the monorepo shared folder so imports like
  // "shared/auth/resolveRecoveryDestination" resolve in tests.

  config = defineConfig({
    root: r('.'),
    server: {
      fs: {
        allow: [path.resolve(__dirname, '..')],
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      isolate: true,
      deps: {
        optimizer: {
          web: {
            include: [
              '@supabase/supabase-js',
              'stripe',
              'cross-fetch',
              'whatwg-fetch',
              'node-fetch',
            ],
            enabled: true,
          },
          ssr: {
            enabled: false,
          },
        },
      },
      server: {
        deps: {
          inline: [
            '@supabase/supabase-js',
            'stripe',
            'cross-fetch',
            'whatwg-fetch',
            'node-fetch',
            'smoothr-sdk.js',
          ],
        },
      },
      // Ensure storefront tests also load the shared setup when executed directly in this workspace.
      setupFiles,
      transformMode: {
        // Force "web" mode for storefront files only
        web: [/.*\/storefronts\/.*\.(m?[jt]sx?)$/],
      },
      esbuild: {
        target: 'es2020',
      },
    },
    resolve: {
      alias: [
        // shared/* → ../shared/*
        { find: /^shared\/(.*)$/, replacement: (_: string, p1: string) => r(`../shared/${p1}`) },
        // Optional: alias 'smoothr' to the app package root in case tests import from it
        { find: /^smoothr\/(.*)$/, replacement: (_: string, p1: string) => r(`../smoothr/${p1}`) },
        // storefronts/* → ./*
        { find: /^storefronts\/(.*)$/, replacement: (_: string, p1: string) => r(p1) }
      ],
      extensions: ['.mjs', '.cjs', '.js', '.mts', '.cts', '.ts', '.jsx', '.tsx', '.json'],
    },
  });
} catch (error) {
  console.error('vitest.config.ts parse error:', error);
  throw error;
}

export default config;

