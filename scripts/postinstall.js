import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// ESM-compatible __dirname
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ✅ Guard: only run from monorepo root
if (process.cwd() !== path.resolve(__dirname, '..')) {
  console.log('[Smoothr] Skipping postinstall — not at monorepo root');
  process.exit(0);
}

const workspaces = ['storefronts', 'smoothr'];

for (const ws of workspaces) {
  const modulesDir = `${ws}/node_modules`;
  if (!fs.existsSync(modulesDir)) {
    console.log(`Installing dependencies for ${ws}...`);
    execSync(`npm --workspace ${ws} install`, { stdio: 'inherit' });
  }
}
