import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'core/index.js'), // your SDK entry point
      name: 'SmoothrSDK',
      fileName: () => 'smoothr-sdk.js' // updated to a clean, professional filename
    },
    rollupOptions: {
      // Externalize deps that shouldn’t be bundled
      external: ['@supabase/supabase-js'],
      output: {
        globals: {
          '@supabase/supabase-js': 'Supabase'
        }
      }
    },
    outDir: 'dist',
    emptyOutDir: true
  }
});
