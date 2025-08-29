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
  {
    ok: content.includes('[data-smoothr="auth-form"]'),
    msg: 'missing [data-smoothr="auth-form"] marker',
  },
  {
    ok: content.includes('[data-smoothr="sign-up"]'),
    msg: 'missing [data-smoothr="sign-up"] marker',
  },
  { ok: content.includes('keydown'), msg: 'missing keydown handler' },
  { ok: content.includes('Enter'), msg: 'missing Enter key handler' },
  {
    ok: !content.includes('form[data-smoothr="auth-form"]'),
    msg: 'contains deprecated form[data-smoothr="auth-form"] selector',
  },
  {
    ok: !content.includes("querySelectorAll('form[data-smoothr=\"auth-form\"]')"),
    msg: 'contains deprecated querySelectorAll(\'form[data-smoothr="auth-form"]\') call',
  },
  {
    ok: !content.includes('querySelectorAll("form[data-smoothr=\'auth-form\']")'),
    msg: 'contains deprecated querySelectorAll("form[data-smoothr=\'auth-form\']") call',
  },
];

for (const c of checks) {
  if (!c.ok) {
    throw new Error(`assert-auth-dist-integrity: ${c.msg}`);
  }
}

console.log('smoothr-sdk.js auth markers verified');
