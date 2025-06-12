import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
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
});
