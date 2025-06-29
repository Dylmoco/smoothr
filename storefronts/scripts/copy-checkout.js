import { copyFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const src = join(__dirname, '..', 'platforms', 'webflow', 'checkout.js');
const dest = join(__dirname, '..', 'dist', 'checkout.js');

try {
  await copyFile(src, dest);
  console.log(`Copied ${src} to ${dest}`);
} catch (err) {
  console.error(`Failed to copy checkout.js: ${err.message}`);
  process.exit(1);
}
