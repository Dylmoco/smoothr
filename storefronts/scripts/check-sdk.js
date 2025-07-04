import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const debug = process.env.SMOOTHR_DEBUG === 'true';
const log = (...args) => debug && console.log('[check-sdk]', ...args);
const err = (...args) => debug && console.error('[check-sdk]', ...args);

const sdkPath = join(__dirname, '..', 'dist', 'smoothr-sdk.js');
const checkoutPath = join(__dirname, '..', 'dist', 'checkout.js');

try {
  await access(sdkPath, constants.F_OK);
  await access(checkoutPath, constants.F_OK);
} catch {
  err(`File not found: ${sdkPath} or ${checkoutPath}`);
  process.exit(1);
}

const content = await readFile(sdkPath, 'utf8');
const missing = [];
if (!content.includes('fetchOrderHistory')) missing.push('fetchOrderHistory');
if (!content.includes('renderOrders')) missing.push('renderOrders');

if (missing.length) {
  err(`Missing exports in smoothr-sdk.js: ${missing.join(', ')}`);
  process.exit(1);
}

log('smoothr-sdk.js contains required exports.');

