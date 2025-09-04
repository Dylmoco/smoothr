import { defineConfig, loadEnv } from 'vite';
import path from 'path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    base: 'https://sdk.smoothr.io/',
    // Only expose env vars prefixed with VITE_
    envPrefix: ['VITE_'],
    optimizeDeps: {
      include: [
        '@supabase/supabase-js',
        'stripe',
        'cross-fetch',
        'whatwg-fetch',
        'node-fetch',
        'smoothr-sdk.js',
        'storefronts/*'
      ]
    },
    define: {
      // Map Cloudflare’s VITE_* secrets into process.env
      'process.env.VITE_SUPABASE_URL': JSON.stringify(
        process.env.VITE_SUPABASE_URL
      ),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(
        process.env.VITE_SUPABASE_ANON_KEY
      ),
      __NEXT_PUBLIC_SUPABASE_OAUTH_REDIRECT_URL__: JSON.stringify(
        env.NEXT_PUBLIC_SUPABASE_OAUTH_REDIRECT_URL
      ),
      __NEXT_PUBLIC_SUPABASE_PASSWORD_RESET_REDIRECT_URL__: JSON.stringify(
        env.NEXT_PUBLIC_SUPABASE_PASSWORD_RESET_REDIRECT_URL
      ),

      // ✅ Live rates API for dynamic currency conversions
      'process.env.LIVE_RATES_URL': JSON.stringify(
        'https://lpuqrzvokroazwlricgn.functions.supabase.co/proxy-live-rates'
      )
    },
    build: {
      target: 'es2020',
      modulePreload: false,
      rollupOptions: {
        external: [/^\/smoothr\/pages\/api\/.*$/],
        input: {
          'smoothr-sdk': path.resolve(__dirname, 'smoothr-sdk.js')
        },
        treeshake: {
          moduleSideEffects: true
        },
        preserveEntrySignatures: 'exports-only',
        output: {
          dir: path.resolve(__dirname, 'dist'),
          entryFileNames: '[name].js',
          format: 'es',
          inlineDynamicImports: true,
          preserveModules: true
        }
      },
      outDir: 'dist',
      emptyOutDir: true,
      assetsDir: ''
    },
    resolve: {
      alias: [
        { find: /^shared\/(.*)$/, replacement: (_, p1) => path.resolve(__dirname, `../shared/${p1}`) },
        { find: /^smoothr\/(.*)$/, replacement: (_, p1) => path.resolve(__dirname, `../smoothr/${p1}`) },
        { find: /^storefronts\/(.*)$/, replacement: (_, p1) => path.resolve(__dirname, p1) },
      ],
    }
  };
});
