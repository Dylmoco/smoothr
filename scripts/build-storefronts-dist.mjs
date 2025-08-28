import { build } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function buildStorefronts() {
  // Build using storefronts/ as the root so it picks up its vite.config.js
  await build({
    root: resolve(__dirname, '../storefronts'),
    logLevel: 'info',
  });
}

// Allow CLI usage: `node scripts/build-storefronts-dist.mjs`
if (import.meta.url === `file://${__filename}`) {
  buildStorefronts().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
