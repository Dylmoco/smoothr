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
