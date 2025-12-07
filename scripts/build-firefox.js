#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const isProd = process.env.NODE_ENV === 'production';

console.log(`Building AutoChat for Firefox ${isProd ? '(Production)' : '(Development)'}...`);

// Create dist-firefox directory
const distDir = path.join(__dirname, '../dist-firefox');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Files to copy directly
const filesToCopy = [
  'farming_phrases.txt',
  'farming_phrases_en.txt',
  'farming_phrases_ur.txt',
  'farming_phrases_es.txt',
  'icon16.png',
  'icon32.png',
  'icon48.png',
  'icon128.png',
  'popup-enhanced.html',
  'styles.css',
];

// Source JS files (will be minified in production)
const jsFiles = [
  'background.js',
  'content-enhanced.js',
  'popup-enhanced.js',
];

// Copy static files
filesToCopy.forEach((file) => {
  const src = path.join(__dirname, '..', file);
  const dest = path.join(distDir, file);
  
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`✓ Copied ${file}`);
  } else {
    console.warn(`⚠ File not found: ${file}`);
  }
});

// Process JS files
jsFiles.forEach((file) => {
  const src = path.join(__dirname, '..', file);
  const dest = path.join(distDir, file);
  
  if (fs.existsSync(src)) {
    let content = fs.readFileSync(src, 'utf8');
    
    // Replace Chrome-specific APIs with browser namespace (Firefox compatible)
    content = content.replace(/chrome\./g, 'browser.');
    
    if (isProd) {
      // Simple minification: remove block comments only (preserve code structure)
      content = content
        .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove block comments only
    }
    
    fs.writeFileSync(dest, content);
    console.log(`✓ Processed ${file} (Firefox compatible)`);
  }
});

// Copy _locales directory recursively
function copyRecursive(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursive(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

const localesDir = path.join(__dirname, '..', '_locales');
const localesDest = path.join(distDir, '_locales');
if (fs.existsSync(localesDir)) {
  copyRecursive(localesDir, localesDest);
  console.log('✓ Copied _locales directory');
}

// Copy src directory for modular files
const srcDir = path.join(__dirname, '..', 'src');
const srcDest = path.join(distDir, 'src');
if (fs.existsSync(srcDir)) {
  copyRecursive(srcDir, srcDest);
  console.log('✓ Copied src directory');
}

// Copy Firefox-specific manifest
const firefoxManifestSrc = path.join(__dirname, '..', 'manifest_firefox.json');
const manifestDest = path.join(distDir, 'manifest.json');
if (fs.existsSync(firefoxManifestSrc)) {
  fs.copyFileSync(firefoxManifestSrc, manifestDest);
  console.log('✓ Copied Firefox manifest');
  
  // Update manifest version
  const manifest = JSON.parse(fs.readFileSync(manifestDest, 'utf8'));
  manifest.version_name = isProd ? `${manifest.version}` : `${manifest.version}-dev`;
  fs.writeFileSync(manifestDest, JSON.stringify(manifest, null, 2));
} else {
  console.error('✗ Firefox manifest not found!');
}

console.log(`\n✅ Firefox build complete! Output: ${distDir}`);
console.log('\n📦 To package for Firefox:');
console.log('   cd dist-firefox && zip -r ../autochat-firefox-v4.5.2.zip *');
