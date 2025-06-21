const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'dist', 'smoothr-sdk.js');

if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

const content = fs.readFileSync(filePath, 'utf8');
const missing = [];
if (!content.includes('fetchOrderHistory')) missing.push('fetchOrderHistory');
if (!content.includes('renderOrders')) missing.push('renderOrders');

if (missing.length) {
  console.error(`Missing exports in smoothr-sdk.js: ${missing.join(', ')}`);
  process.exit(1);
}

console.log('smoothr-sdk.js contains required exports.');

