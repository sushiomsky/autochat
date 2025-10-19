#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const distDir = path.join(__dirname, '../dist');
const manifest = JSON.parse(fs.readFileSync(path.join(distDir, 'manifest.json'), 'utf8'));
const version = manifest.version;
const outputName = `autochat-v${version}.zip`;

console.log(`📦 Packaging AutoChat v${version}...`);

// Check if dist exists
if (!fs.existsSync(distDir)) {
  console.error('❌ dist/ directory not found. Run npm run build first.');
  process.exit(1);
}

// Create zip
try {
  execSync(`cd dist && zip -r ../${outputName} *`, { stdio: 'inherit' });
  console.log(`\n✅ Package created: ${outputName}`);
  console.log(`📊 Size: ${(fs.statSync(outputName).size / 1024).toFixed(2)} KB`);
} catch (error) {
  console.error('❌ Failed to create package:', error.message);
  process.exit(1);
}
