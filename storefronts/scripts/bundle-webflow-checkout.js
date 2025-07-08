import { build } from 'esbuild';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));

const debug = process.env.SMOOTHR_DEBUG === 'true';
const log = (...args) => debug && console.log('[bundle-webflow-checkout]', ...args);
const err = (...args) => debug && console.error('[bundle-webflow-checkout]', ...args);

const entry = join(__dirname, '..', 'platforms', 'webflow', 'checkout.js');
const outFile = join(__dirname, '..', 'dist', 'platforms', 'webflow', 'checkout.js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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
