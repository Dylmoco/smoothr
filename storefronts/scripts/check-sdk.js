import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const filePath = join(__dirname, '..', 'dist', 'smoothr-sdk.js');

try {
  await access(filePath, constants.F_OK);
} catch {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

const content = await readFile(filePath, 'utf8');
const missing = [];
if (!content.includes('fetchOrderHistory')) missing.push('fetchOrderHistory');
if (!content.includes('renderOrders')) missing.push('renderOrders');

if (missing.length) {
  console.error(`Missing exports in smoothr-sdk.js: ${missing.join(', ')}`);
  process.exit(1);
}

console.log('smoothr-sdk.js contains required exports.');

