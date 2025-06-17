import { defineConfig, loadEnv } from 'vite';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    define: {
      __NEXT_PUBLIC_SUPABASE_URL__: JSON.stringify(env.NEXT_PUBLIC_SUPABASE_URL),
      __NEXT_PUBLIC_SUPABASE_ANON_KEY__: JSON.stringify(env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      __NEXT_PUBLIC_SUPABASE_OAUTH_REDIRECT_URL__: JSON.stringify(
        env.NEXT_PUBLIC_SUPABASE_OAUTH_REDIRECT_URL
      ),
      __NEXT_PUBLIC_SUPABASE_PASSWORD_RESET_REDIRECT_URL__: JSON.stringify(
        env.NEXT_PUBLIC_SUPABASE_PASSWORD_RESET_REDIRECT_URL
      )
    },
    build: {
      lib: {
        entry: path.resolve(__dirname, 'core/index.js'), // SDK entry point
        name: 'SmoothrSDK',
        fileName: () => 'smoothr-sdk.js',
        formats: ['es'] // Output ES module only
      },
      // rollupOptions removed for bundling everything
      rollupOptions: {
        treeshake: false
      },
      outDir: 'dist',
      emptyOutDir: true
    }
  };
});
