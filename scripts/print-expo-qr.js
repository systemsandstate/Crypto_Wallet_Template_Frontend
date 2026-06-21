#!/usr/bin/env node
const { printQRCode } = require('@expo/cli/build/src/utils/qr');

const url = process.argv[2];
if (!url) {
  console.error('Usage: node scripts/print-expo-qr.js <exp://url>');
  process.exit(1);
}

console.log('');
console.log(`Expo Go URL: ${url}`);
console.log('');
printQRCode(url).print();
console.log('Scan the QR code above in Expo Go, or enter the URL manually.');
console.log('');
