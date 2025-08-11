import { defineConfig, loadEnv } from 'vite';
import path from 'path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    base: env.VITE_CDN_BASE_URL || (mode === 'development' ? 'http://localhost:4173/' : '/'),
    optimizeDeps: {
      include: ['@supabase/supabase-js']
    },
    define: {
      // Map Cloudflare’s NEXT_PUBLIC_* secrets into process.env
      'process.env.NEXT_PUBLIC_SUPABASE_URL': JSON.stringify(env.NEXT_PUBLIC_SUPABASE_URL),
      'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      __NEXT_PUBLIC_SUPABASE_OAUTH_REDIRECT_URL__: JSON.stringify(
        env.NEXT_PUBLIC_SUPABASE_OAUTH_REDIRECT_URL
      ),
      __NEXT_PUBLIC_SUPABASE_PASSWORD_RESET_REDIRECT_URL__: JSON.stringify(
        env.NEXT_PUBLIC_SUPABASE_PASSWORD_RESET_REDIRECT_URL
      ),

      // ✅ Live rates API for dynamic currency conversions
      'process.env.LIVE_RATES_URL': JSON.stringify(env.VITE_LIVE_RATES_URL)
    },
    build: {
      target: 'esnext', // ✅ Enables top-level await
      rollupOptions: {
        external: [],
        input: {
          'smoothr-sdk': path.resolve(__dirname, 'smoothr-sdk.js')
        },
        treeshake: true,
        preserveEntrySignatures: 'exports-only',
        output: {
          dir: path.resolve(__dirname, 'dist'),
          entryFileNames: '[name].js',
          format: 'es',
          inlineDynamicImports: true
        }
      },
      outDir: 'dist',
      emptyOutDir: true,
      assetsDir: ''
    }
  };
});
