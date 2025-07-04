import { copyFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const debug = process.env.SMOOTHR_DEBUG === 'true';
const log = (...args) => debug && console.log('[copy-checkout]', ...args);
const err = (...args) => debug && console.error('[copy-checkout]', ...args);

// Use the generic checkout script that mounts individual card fields
const src = join(__dirname, '..', 'checkout', 'checkout.js');
const dest = join(__dirname, '..', 'dist', 'checkout.js');

try {
  await copyFile(src, dest);
  log(`Copied ${src} to ${dest}`);
} catch (err) {
  err(`Failed to copy checkout.js: ${err.message}`);
  process.exit(1);
}
