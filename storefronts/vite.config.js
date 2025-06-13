import { defineConfig, loadEnv } from 'vite';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    define: {
      __NEXT_PUBLIC_SUPABASE_URL__: JSON.stringify(env.NEXT_PUBLIC_SUPABASE_URL),
      __NEXT_PUBLIC_SUPABASE_ANON_KEY__: JSON.stringify(env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    },
    build: {
      lib: {
        entry: path.resolve(__dirname, 'core/index.js'), // SDK entry point
        name: 'SmoothrSDK',
        fileName: () => 'smoothr-sdk.js',
        formats: ['es'] // Output ES module only
      },
      // rollupOptions removed for bundling everything
      outDir: 'dist',
      emptyOutDir: true
    }
  };
});
