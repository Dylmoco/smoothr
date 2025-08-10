import { spawnSync } from 'node:child_process';

function hasDeno() {
  const r = spawnSync(process.platform === 'win32' ? 'where' : 'which', ['deno'], { stdio: 'ignore' });
  return r.status === 0;
}

if (!hasDeno()) {
  const cmd = process.argv.slice(2).join(' ');
  console.warn(`[skip] Deno not found; skipping: deno ${cmd}`);
  process.exit(0);
}

const args = process.argv.slice(2);
const child = spawnSync('deno', args, { stdio: 'inherit' });
process.exit(child.status ?? 1);
