import { build } from 'esbuild';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));

const debug = process.env.SMOOTHR_DEBUG === 'true';
const log = (...args) => debug && console.log('[bundle-webflow-checkout]', ...args);
const err = (...args) => debug && console.error('[bundle-webflow-checkout]', ...args);

const entry = join(__dirname, '..', 'platforms', 'webflow', 'checkout.js');
const outFile = join(__dirname, '..', 'dist', 'platforms', 'webflow', 'checkout.js');

try {
  await mkdir(dirname(outFile), { recursive: true });
  await build({
    entryPoints: [entry],
    outfile: outFile,
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2018'
  });
  log(`Bundled ${entry} to ${outFile}`);
} catch (e) {
  err(`Failed to bundle Webflow checkout: ${e.message}`);
  process.exit(1);
}
