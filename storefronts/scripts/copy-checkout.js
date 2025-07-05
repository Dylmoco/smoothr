import { copyFile, mkdir, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const debug = process.env.SMOOTHR_DEBUG === 'true';
const log = (...args) => debug && console.log('[copy-checkout]', ...args);
const err = (...args) => debug && console.error('[copy-checkout]', ...args);

// Use the generic checkout script that mounts individual card fields
const src = join(__dirname, '..', 'checkout', 'checkout.js');
const dest = join(__dirname, '..', 'dist', 'checkout.js');
const gatewaysSrcDir = join(__dirname, '..', 'checkout', 'gateways');
const gatewaysDestDir = join(__dirname, '..', 'dist', 'gateways');

try {
  await copyFile(src, dest);
  log(`Copied ${src} to ${dest}`);
} catch (err) {
  err(`Failed to copy checkout.js: ${err.message}`);
  process.exit(1);
}

let gatewayFiles = [];
try {
  gatewayFiles = await readdir(gatewaysSrcDir);
} catch (error) {
  err(`Failed to read gateways directory: ${error.message}`);
  process.exit(1);
}

for (const file of gatewayFiles) {
  const srcFile = join(gatewaysSrcDir, file);
  const destFile = join(gatewaysDestDir, file);
  try {
    await mkdir(dirname(destFile), { recursive: true });
    await copyFile(srcFile, destFile);
    log(`Copied ${srcFile} to ${destFile}`);
  } catch (error) {
    err(`Failed to copy ${file}: ${error.message}`);
    process.exit(1);
  }
}
