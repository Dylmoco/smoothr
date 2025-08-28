import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(__dirname, '../storefronts/dist/smoothr-sdk.js');
const content = fs.readFileSync(distPath, 'utf8');

const checks = [
  { ok: content.includes('[data-smoothr="auth-form"]'), msg: 'missing [data-smoothr="auth-form"]' },
  { ok: content.includes('keydown'), msg: 'missing keydown handler' },
  { ok: content.includes('sign-up'), msg: 'missing sign-up handler' },
  { ok: !content.includes('form[data-smoothr="auth-form"]'), msg: 'contains deprecated form[data-smoothr="auth-form"] selector' },
];

for (const c of checks) {
  if (!c.ok) {
    console.error(`assert-auth-dist-integrity: ${c.msg}`);
    process.exit(1);
  }
}

console.log('smoothr-sdk.js auth markers verified');
