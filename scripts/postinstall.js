import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cwd = process.cwd();
const root = path.resolve(__dirname, '..');

if (cwd !== root) {
  console.log(`[Smoothr] Skipping postinstall — not at monorepo root`);
  process.exit(0);
}

// 🧠 Detect if we're running as part of another install to avoid loops
const npmArgs = process.env.npm_config_argv;
if (npmArgs && npmArgs.includes('postinstall')) {
  console.log('[Smoothr] Detected nested npm install from postinstall — skipping to prevent loop');
  process.exit(0);
}

const workspaces = ['storefronts', 'smoothr'];
for (const ws of workspaces) {
  const wsPath = path.join(root, ws);
  const modulesDir = path.join(wsPath, 'node_modules');

  if (cwd.startsWith(wsPath)) {
    console.log(`[Smoothr] Skipping install for ${ws} (already inside workspace)`);
    continue;
  }

  if (!fs.existsSync(modulesDir)) {
    console.log(`[Smoothr] Installing dependencies for ${ws}...`);
    // Prevent nested execution of this postinstall script by ignoring lifecyclee
    // scripts when installing workspace dependencies
    execSync(`npm --workspace ${ws} install --ignore-scripts`, {
      stdio: 'inherit',
    });
  }
}
