import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'core/index.js'), // SDK entry point
      name: 'SmoothrSDK',
      fileName: () => 'smoothr-sdk.js',
      formats: ['es'] // <-- CRITICAL: output ES module only!
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
