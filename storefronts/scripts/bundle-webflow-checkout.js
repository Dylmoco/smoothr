import { build } from 'esbuild';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';
import { loadEnv } from 'vite';

const __dirname = dirname(fileURLToPath(import.meta.url));

const debug = process.env.SMOOTHR_DEBUG === 'true';
const log = (...args) => debug && console.log('[bundle-webflow-checkout]', ...args);
// Always log errors, even when SMOOTHR_DEBUG is disabled.
const err = (...args) => console.error('[bundle-webflow-checkout]', ...args);

const entry = join(__dirname, '..', 'platforms', 'webflow', 'checkout.js');
const outFile = join(__dirname, '..', 'dist', 'platforms', 'webflow', 'checkout.js');

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  const env = loadEnv('', join(__dirname, '..'), '');
  if (!supabaseUrl) supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseAnonKey) supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables'
  );
}

try {
  await mkdir(dirname(outFile), { recursive: true });
  await build({
    entryPoints: [entry],
    outfile: outFile,
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2018',
    define: {
      'process.env.NODE_ENV': '"production"',
      __NEXT_PUBLIC_SUPABASE_URL__: JSON.stringify(supabaseUrl),
      __NEXT_PUBLIC_SUPABASE_ANON_KEY__: JSON.stringify(supabaseAnonKey)
    }
  });
  log(`Bundled ${entry} to ${outFile}`);
} catch (e) {
  err(`Failed to bundle Webflow checkout: ${e.message}`);
  process.exit(1);
}
