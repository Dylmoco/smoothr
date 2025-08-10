import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const repoRoot = path.resolve(fileURLToPath(import.meta.url), '..', '..');
const rootDir = path.join(repoRoot, 'storefronts');
const exts = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'];
const warnings = [];

function isUrl(spec) {
  return spec.startsWith('http://') || spec.startsWith('https://');
}

function isExternal(spec) {
  return !isUrl(spec) && /^[a-zA-Z@][^:]*$/.test(spec);
}

function isLocal(spec) {
  return spec.startsWith('./') || spec.startsWith('../') || spec.startsWith('/');
}

function scanFile(file) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, idx) => {
    const match = line.match(/import\s+(?:[^'"\n]+?from\s*)?['"]([^'"\n]+)['"]/);
    if (!match) return;
    const spec = match[1];
    if (isExternal(spec) || !isLocal(spec) || spec.endsWith('.js')) return;
    warnings.push(`${path.relative(repoRoot, file)}:${idx + 1}: ${spec}`);
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

walk(rootDir);

if (warnings.length) {
  warnings.forEach(w => console.warn(w));
  console.warn(`Found ${warnings.length} local import(s) without .js extension`);
} else {
  console.log('All SDK local imports use .js extension');
}
