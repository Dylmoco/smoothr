// Root config kept minimal so workspace configs (like storefronts/vitest.config.ts)
// fully control their environment. Do not force SSR here.
import { defineConfig } from 'vitest/config';

export default defineConfig({});

