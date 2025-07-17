// storefronts/scripts/copy-checkout.js

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

// Gateways
const gatewaysSrcDir = join(__dirname, '..', 'checkout', 'gateways');
const gatewaysDestDir = join(__dirname, '..', 'dist', 'gateways');

// Webflow adapter: point to the updated client/platforms path
const webflowSrc = join(
  __dirname,
  '..',
  '..',
  'client',
  'platforms',
  'webflow',
  'checkoutAdapter.js'
);
const webflowDest = join(
  __dirname,
  '..',
  'dist',
  'platforms',
  'webflow',
  'checkout.js'
);

// Utility scripts
const waitForElementSrc = join(
  __dirname,
  '..',
  'checkout',
  'utils',
  'waitForElement.js'
);
const waitForElementDest = join(
  __dirname,
  '..',
  'dist',
  'utils',
  'waitForElement.js'
);

try {
  await copyFile(src, dest);
  log(`Copied ${src} to ${dest}`);
} catch (err) {
  err(`Failed to copy checkout.js: ${err.message}`);
  process.exit(1);
}

try {
  await mkdir(dirname(webflowDest), { recursive: true });
  await copyFile(webflowSrc, webflowDest);
  log(`Copied ${webflowSrc} to ${webflowDest}`);
} catch (err) {
  err(`Failed to copy Webflow checkout adapter: ${err.message}`);
  process.exit(1);
}

try {
  await mkdir(dirname(waitForElementDest), { recursive: true });
  await copyFile(waitForElementSrc, waitForElementDest);
  log(`Copied ${waitForElementSrc} to ${waitForElementDest}`);
} catch (error) {
  err(`Failed to copy waitForElement.js: ${error.message}`);
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
