#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist-firefox');
const manifestPath = path.join(rootDir, 'manifest_firefox.json');
const { version } = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const outputName = `autochat-firefox-v${version}.zip`;

console.log(`📦 Packaging Firefox AutoChat v${version}...`);

if (!fs.existsSync(distDir)) {
  console.error('❌ dist-firefox/ directory not found. Run npm run build:firefox first.');
  process.exit(1);
}

try {
  execSync(`cd dist-firefox && zip -r ../${outputName} *`, { stdio: 'inherit' });
  console.log(`\n✅ Package created: ${outputName}`);
  console.log(
    `📊 Size: ${(fs.statSync(path.join(rootDir, outputName)).size / 1024).toFixed(2)} KB`
  );
} catch (error) {
  console.error('❌ Failed to create Firefox package:', error.message);
  process.exit(1);
}
