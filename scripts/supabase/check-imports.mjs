import fs from 'fs';
import path from 'path';

const fxDir = path.join(process.cwd(), 'supabase', 'functions');
const bad = [];
function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) { if (!ent.name.startsWith('.')) walk(full); continue; }
    if (!/\.(ts|js|mjs|jsx|tsx)$/.test(ent.name)) continue;
    if (ent.name.endsWith('.test.ts')) continue;
    const src = fs.readFileSync(full, 'utf8');
    const re = /from\s+['"]([^'"\n]+)['"]/g;
    let m;
    while ((m = re.exec(src))) {
      const spec = m[1];
      if (spec.startsWith('shared/') || spec.includes('../shared/') || spec.startsWith('smoothr/')) {
        bad.push(`${path.relative(process.cwd(), full)} -> ${spec}`);
      }
    }
  }
}
walk(fxDir);
if (bad.length) {
  console.error('Edge functions must not import monorepo server/shared code:\n' + bad.join('\n'));
  process.exit(1);
}
console.log('No forbidden imports in edge functions ✅');
