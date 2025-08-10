import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const repoRoot = path.resolve(fileURLToPath(import.meta.url), '..', '..');
const dirs = ['shared', 'smoothr'];
const exts = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'];
const offenders = [];

function isUrl(spec) {
  return spec.startsWith('http://') || spec.startsWith('https://');
}

function isExternal(spec) {
  return !isUrl(spec) && /^[a-zA-Z@][^:]*$/.test(spec);
}

function isLocal(spec) {
  return spec.startsWith('./') || spec.startsWith('../') || spec.startsWith('/') || spec.startsWith('shared/') || spec.startsWith('smoothr/');
}

function scanFile(file) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, idx) => {
    const match = line.match(/import\s+(?:[^'"\n]+?from\s*)?['"]([^'"\n]+)['"]/);
    if (!match) return;
    const spec = match[1];
    if (isExternal(spec) || !isLocal(spec) || !spec.endsWith('.js')) return;
    offenders.push(`${path.relative(repoRoot, file)}:${idx + 1}: ${spec}`);
  });
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

for (const d of dirs) {
  walk(path.join(repoRoot, d));
}

if (offenders.length) {
  offenders.forEach(o => console.error(o));
  console.error(`Found ${offenders.length} local import(s) ending in .js`);
  process.exit(1);
}

console.log('No local .js imports found in server code');
