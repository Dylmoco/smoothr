import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// ✅ ESM-safe __dirname
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 🔒 Only run this script if we're at the monorepo root (not inside a workspace)
const cwd = process.cwd();
const root = path.resolve(__dirname, '..');

if (cwd !== root) {
  console.log(`[Smoothr] Skipping postinstall — running from ${cwd}, not monorepo root`);
  process.exit(0);
}

// ✅ Verify workspace installs so vitest and other dev tools are available
const workspaces = ['storefronts', 'smoothr'];

for (const ws of workspaces) {
  const modulesDir = path.join(root, ws, 'node_modules');
  if (!fs.existsSync(modulesDir)) {
    console.log(`[Smoothr] Installing dependencies for ${ws}...`);
    execSync(`npm --workspace ${ws} install`, { stdio: 'inherit' });
  }
}
