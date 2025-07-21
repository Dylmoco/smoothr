import { defineConfig } from 'vitest/config';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadEnv } from 'vite';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '');
  return {
    test: {
      environment: 'happy-dom',
      setupFiles: './vitest.setup.js'
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, '../smoothr')
      }
    },
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.NEXT_PUBLIC_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    }
  };
});
