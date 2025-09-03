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
  test: {
    environment: 'jsdom',
    globals: true,
    isolate: true,
    // Keep tests in "web" transform to preserve ESM (avoid SSR CJS rewrite)
    transformMode: {
      web: [/\.([cm]?[jt]s)x?$/],
      ssr: [/node_modules/]
    },
    deps: {
      // Ensure ESM libs are bundled as ESM, not required as CJS
      inline: [
        '@supabase/supabase-js',
        // if any tests import these directly, keep them ESM too:
        'cross-fetch',
        'whatwg-fetch'
      ]
    }
  },
  esbuild: {
    target: 'es2020'
  },
  resolve: {
    alias: [
      // shared/* → ../shared/*
      { find: sharedAliasFind, replacement: (m: string) => r(`../shared/${m.replace('shared/', '')}`) },
      // Optional: alias 'smoothr' to the app package root in case tests import from it
      { find: /^smoothr\/(.*)$/, replacement: (m: string) => r(`../smoothr/${m.replace('smoothr/', '')}`) }
    ]
  },
  // Make sure Vite doesn't try to pre-bundle ESM deps back to CJS for SSR
  optimizeDeps: {
    esbuildOptions: {
      mainFields: ['module', 'jsnext:main', 'browser']
    },
    include: [
      '@supabase/supabase-js'
    ]
  }
});

