import { globby } from 'globby';
import fs from 'fs/promises';
const files = await globby(['storefronts/**/*.{js,ts,tsx,jsx}']);
const offenders = [];
for (const f of files) {
  const s = await fs.readFile(f, 'utf8');
  if (s.includes('SUPABASE_SERVICE_ROLE_KEY')) offenders.push(f);
}
if (offenders.length) {
  console.error('Service role key referenced in client files:', offenders);
  process.exit(1);
}
console.log('OK: no service-role references in storefronts/');
