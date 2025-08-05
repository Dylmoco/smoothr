import { defineConfig, loadEnv } from 'vite';
import path from 'path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
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
      'process.env.LIVE_RATES_URL': JSON.stringify(
        'https://lpuqrzvokroazwlricgn.functions.supabase.co/proxy-live-rates'
      )
    },
    build: {
      target: 'esnext', // ✅ Enables top-level await
      rollupOptions: {
        external: [],
        input: {
            'sdk-auth-entry': path.resolve(
              __dirname,
              'features/auth/sdk-auth-entry.js'
            ),
          checkout: path.resolve(__dirname, 'features/checkout/checkout-core.js')
        },
        treeshake: true,
        preserveEntrySignatures: 'exports-only',
        output: {
          dir: path.resolve(__dirname, 'dist'),
          entryFileNames: 'smoothr-[name].js',
          format: 'es'
        }
      },
      outDir: 'dist',
      emptyOutDir: true,
      assetsDir: ''
    }
  };
});
