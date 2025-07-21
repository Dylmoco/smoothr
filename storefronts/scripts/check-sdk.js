import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const debug = process.env.SMOOTHR_DEBUG === 'true';
const log = (...args) => debug && console.log('[check-sdk]', ...args);
const err = (...args) => debug && console.error('[check-sdk]', ...args);

const sdkPath = join(__dirname, '..', 'dist', 'smoothr-sdk.js');
const checkoutPath = join(__dirname, '..', 'dist', 'checkout.js');
const stripePath = join(__dirname, '..', 'dist', 'gateways', 'stripe.js');
const nmiPath = join(__dirname, '..', 'dist', 'gateways', 'nmi.js');
const webflowCheckoutPath = join(
  __dirname,
  '..',
  'dist',
  'platforms',
  'webflow',
  'checkout.js'
);
const waitForElementPath = join(
  __dirname,
  '..',
  'dist',
  'utils',
  'waitForElement.js'
);

try {
  await access(sdkPath, constants.F_OK);
  await access(checkoutPath, constants.F_OK);
  await access(stripePath, constants.F_OK);
  await access(nmiPath, constants.F_OK);
  await access(webflowCheckoutPath, constants.F_OK);
  await access(waitForElementPath, constants.F_OK);
} catch {
  err(
    `File not found: ${sdkPath} or ${checkoutPath} or ${stripePath} or ${nmiPath} or ${webflowCheckoutPath} or ${waitForElementPath}`
  );
  process.exit(1);
}

const content = await readFile(sdkPath, 'utf8');
const missing = [];
if (!content.includes('fetchOrderHistory')) missing.push('fetchOrderHistory');
if (!content.includes('renderOrders')) missing.push('renderOrders');

if (missing.length) {
  err(`Missing exports in smoothr-sdk.js: ${missing.join(', ')}`);
  process.exit(1);
}

log('smoothr-sdk.js contains required exports.');

const nmiContent = await readFile(nmiPath, 'utf8');
const nmiMissing = [];
if (!nmiContent.includes('createPaymentMethod')) nmiMissing.push('createPaymentMethod');
if (!nmiContent.includes('mountNMI')) nmiMissing.push('mountNMI');
if (!nmiContent.includes('ready')) nmiMissing.push('ready');
if (nmiMissing.length) {
  err(`Missing exports in nmi.js: ${nmiMissing.join(', ')}`);
  process.exit(1);
}

log('nmi.js contains required exports.');

const filesToScan = [
  { path: sdkPath, name: 'smoothr-sdk.js' },
  { path: checkoutPath, name: 'checkout.js' },
  { path: stripePath, name: 'gateways/stripe.js' },
  { path: nmiPath, name: 'gateways/nmi.js' },
  { path: webflowCheckoutPath, name: 'platforms/webflow/checkout.js' },
  { path: waitForElementPath, name: 'utils/waitForElement.js' },
];

const flagged = [];

for (const file of filesToScan) {
  const text = await readFile(file.path, 'utf8');
  if (text.includes('import.meta.env')) flagged.push(file.name);
}

if (flagged.length) {
  err(`import.meta.env found in: ${flagged.join(', ')}`);
  process.exit(1);
}

log('No import.meta.env references detected.');

