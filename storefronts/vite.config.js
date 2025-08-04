import { defineConfig, loadEnv } from 'vite';
import path from 'path';
import fs from 'fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function getAllJs(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.resolve(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllJs(full));
    } else if (entry.isFile() && full.endsWith('.js')) {
      files.push(full);
    }
  }
  return files;
}

const inputFiles = getAllJs(path.resolve(__dirname, 'core'));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    optimizeDeps: {
      include: [
        '@supabase/supabase-js',
        '@supabase/gotrue-js',
        '@supabase/postgrest-js',
        '@supabase/storage-js',
        '@supabase/realtime-js',
        '@supabase/functions-js',
        'isows'
      ]
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
        input: inputFiles,
        treeshake: false,
        preserveEntrySignatures: 'exports-only',
        output: {
          preserveModules: true,
          preserveModulesRoot: path.resolve(__dirname, 'core'),
          entryFileNames: (chunk) =>
            chunk.name === 'index' ? 'smoothr-sdk.js' : '[name].js',
          chunkFileNames: '[name].js'
        }
      },
      outDir: 'dist',
      emptyOutDir: true
    }
  };
});
