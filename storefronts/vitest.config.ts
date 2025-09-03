import { defineConfig } from 'vitest/config';
import path from 'node:path';
import url from 'node:url';

// Resolve a path relative to THIS config file (storefronts/)
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const r = (p: string) => path.resolve(__dirname, p);

// Map "shared/..." to the monorepo shared folder so imports like
// "shared/auth/resolveRecoveryDestination" resolve in tests.
const sharedAliasFind = /^shared\/(.*)$/;

export default defineConfig({
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
            'cross-fetch',
            'whatwg-fetch',
          ],
        },
      },
      // Keep vite-node from SSR-rewriting ESM to CJS for these libs
      inline: [
        '@supabase/supabase-js',
        'cross-fetch',
        'whatwg-fetch',
      ],
    },
    // Ensure storefront tests also load the shared setup when executed directly in this workspace.
    setupFiles: [
      r('../vitest.setup.ts'),
      r('./tests/setup.ts')
    ],
    transformMode: {
      // Force "web" mode for anything under this package
      web: [/\.([cm]?[jt]s)x?$/],
    },
    esbuild: {
      target: 'es2020',
    },
  },
  resolve: {
    alias: [
      // shared/* → ../shared/*
      { find: sharedAliasFind, replacement: (m: string) => r(`../shared/${m.replace('shared/', '')}`) },
      // Optional: alias 'smoothr' to the app package root in case tests import from it
      { find: /^smoothr\/(.*)$/, replacement: (m: string) => r(`../smoothr/${m.replace('smoothr/', '')}`) }
    ]
  }
});

