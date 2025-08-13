import fs from 'fs';
import path from 'path';
import toml from '@iarna/toml';

const root = process.cwd();
const cfgPath = path.join(root, 'supabase', 'config.toml');
const fxDir = path.join(root, 'supabase', 'functions');

const cfg = toml.parse(fs.readFileSync(cfgPath, 'utf8'));
const entries = Object.entries(cfg.functions || {}).map(([k, v]) => ({ name: k, ...v }));

const dirs = fs.readdirSync(fxDir, { withFileTypes: true })
  .filter(d => d.isDirectory() && !d.name.startsWith('_'))
  .map(d => d.name);

const problems = [];
for (const d of dirs) {
  const hasCfg = entries.find(e => e.name === d);
  if (!hasCfg) problems.push(`Missing [functions.${d}] entry in config.toml`);
  const idx = ['index.ts', 'index.js', 'handler.ts', 'handler.js'].some(f => fs.existsSync(path.join(fxDir, d, f)));
  if (!idx) problems.push(`No entrypoint (index.ts/js or handler.ts/js) in functions/${d}`);
}

for (const e of entries) {
  if (!dirs.includes(e.name)) problems.push(`config.toml has function '${e.name}' but directory is missing`);
}

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
} else {
  console.log('Supabase functions config looks consistent ✅');
}
