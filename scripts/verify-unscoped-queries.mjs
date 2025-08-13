import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const repoRoot = path.resolve(fileURLToPath(import.meta.url), '..', '..');
const rootDir = path.join(repoRoot, 'storefronts');
const exts = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'];
const tables = ['orders', 'discounts', 'discount_usages', 'integrations', 'store_settings'];
const offenders = [];

function scanFile(file) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fromMatch = line.match(/\.from\(['"](orders|discounts|discount_usages|integrations|store_settings)['"]\)/);
    if (fromMatch) {
      let hasEq = false;
      for (let j = i; j < Math.min(lines.length, i + 10); j++) {
        const checkLine = lines[j];
        if (/\.eq\(['"]store_id['"]/.test(checkLine)) {
          hasEq = true;
          break;
        }
        if (j > i && /\.from\(/.test(checkLine)) break;
        if (/;/.test(checkLine)) break;
      }
      if (!hasEq) {
        offenders.push(`${path.relative(repoRoot, file)}:${i + 1}: ${line.trim()}`);
      }
    }
  }
}

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (exts.includes(path.extname(entry.name))) {
      scanFile(full);
    }
  }
}

walk(rootDir);

if (offenders.length) {
  offenders.forEach(o => console.error(o));
  console.error(`Found ${offenders.length} unscoped quer${offenders.length === 1 ? 'y' : 'ies'}`);
  process.exit(1);
}

console.log('No unscoped queries found');

