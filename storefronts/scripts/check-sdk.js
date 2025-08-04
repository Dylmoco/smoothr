import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sdkPath = resolve(__dirname, '..', 'dist', 'smoothr-sdk.js');

try {
  await access(sdkPath, constants.F_OK);
} catch {
  console.error(`File not found: ${sdkPath}`);
  process.exit(1);
}

const content = await readFile(sdkPath, 'utf8');
const required = ['window.smoothr', 'auth', 'orders', 'analytics'];
const missing = required.filter((str) => !content.includes(str));

if (missing.length) {
  console.error(
    `Missing required strings in smoothr-sdk.js: ${missing.join(', ')}`
  );
  process.exit(1);
}

console.log('smoothr-sdk.js contains required strings.');
