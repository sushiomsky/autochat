#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const isProd = process.env.NODE_ENV === 'production';
const isWatch = process.argv.includes('--watch');

console.log(`Building AutoChat ${isProd ? '(Production)' : '(Development)'}...`);

// Create dist directory
const distDir = path.join(__dirname, '../dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Files to copy directly
const filesToCopy = [
  'manifest.json',
  'farming_phrases.txt',
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
    
    if (isProd) {
      // Simple minification: remove comments and extra whitespace
      content = content
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
        .replace(/\/\/.*/g, '') // Remove line comments
        .replace(/\n\s*\n/g, '\n') // Remove empty lines
        .replace(/^\s+/gm, ''); // Remove leading whitespace
    }
    
    fs.writeFileSync(dest, content);
    console.log(`✓ Processed ${file}`);
  }
});

// Update manifest version
const manifestPath = path.join(distDir, 'manifest.json');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.version_name = isProd ? `${manifest.version}` : `${manifest.version}-dev`;
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
}

console.log(`\n✅ Build complete! Output: ${distDir}`);

if (isWatch) {
  console.log('\n👀 Watching for changes...');
  const srcDir = path.join(__dirname, '..');
  
  fs.watch(srcDir, { recursive: false }, (eventType, filename) => {
    if (filename && (filesToCopy.includes(filename) || jsFiles.includes(filename))) {
      console.log(`\n🔄 ${filename} changed, rebuilding...`);
      
      const src = path.join(srcDir, filename);
      const dest = path.join(distDir, filename);
      
      if (fs.existsSync(src)) {
        let content = fs.readFileSync(src, 'utf8');
        
        if (jsFiles.includes(filename) && isProd) {
          content = content
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/\/\/.*/g, '')
            .replace(/\n\s*\n/g, '\n')
            .replace(/^\s+/gm, '');
        }
        
        fs.writeFileSync(dest, content);
        console.log(`✓ Rebuilt ${filename}`);
      }
    }
  });
}
