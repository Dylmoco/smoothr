import { copyFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Use the generic checkout script that mounts individual card fields
const src = join(__dirname, '..', 'checkout', 'checkout.js');
const dest = join(__dirname, '..', 'dist', 'checkout.js');

try {
  await copyFile(src, dest);
  console.log(`Copied ${src} to ${dest}`);
} catch (err) {
  console.error(`Failed to copy checkout.js: ${err.message}`);
  process.exit(1);
}
