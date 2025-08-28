import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(__dirname, '../storefronts/dist/smoothr-sdk.js');

if (!fs.existsSync(distPath)) {
  throw new Error(`assert-auth-dist-integrity: missing bundle at ${distPath}`);
}

const content = fs.readFileSync(distPath, 'utf8');

const checks = [
  { ok: content.includes('[data-smoothr="auth-form"]'), msg: 'missing [data-smoothr="auth-form"]' },
  { ok: content.includes('keydown'), msg: 'missing keydown handler' },
  { ok: content.includes('sign-up'), msg: 'missing sign-up handler' },
  {
    ok: !content.includes('form[data-smoothr="auth-form"]'),
    msg: 'contains deprecated form[data-smoothr="auth-form"] selector',
  },
];

for (const c of checks) {
  if (!c.ok) {
    throw new Error(`assert-auth-dist-integrity: ${c.msg}`);
  }
}

console.log('smoothr-sdk.js auth markers verified');
