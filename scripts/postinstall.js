import fs from 'fs';
import { execSync } from 'child_process';

const workspaces = ['storefronts', 'smoothr'];

for (const ws of workspaces) {
  const modulesDir = `${ws}/node_modules`;
  if (!fs.existsSync(modulesDir)) {
    console.log(`Installing dependencies for ${ws}...`);
    execSync(`npm --workspace ${ws} install`, { stdio: 'inherit' });
  }
}

