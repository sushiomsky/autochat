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

// Create libs directory
const libsDir = path.join(distDir, 'libs');
if (!fs.existsSync(libsDir)) {
  fs.mkdirSync(libsDir, { recursive: true });
}

// Files to copy directly
const filesToCopy = [
  'manifest.json',
  'farming_phrases.txt',
  'farming_phrases_en.txt',
  'farming_phrases_ur.txt',
  'farming_phrases_es.txt',
  'icon16.png',
  'icon32.png',
  'icon48.png',
  'icon128.png',
  'popup-enhanced.html',
  'chat-log-viewer.html',
  'styles.css',
];

// Source JS files (will be minified in production)
const jsFiles = [
  'background.js',
  'content-enhanced.js',
  'popup-enhanced.js',
  'chat-log-viewer.js',
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
      // Simple minification: remove block comments only (preserve code structure)
      content = content
        .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove block comments only
    }

    fs.writeFileSync(dest, content);
    console.log(`✓ Processed ${file}`);
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

// Copy Chart.js from node_modules
const chartSource = path.join(__dirname, '../node_modules/chart.js/dist/chart.umd.js');
const chartDest = path.join(libsDir, 'chart.js');
if (fs.existsSync(chartSource)) {
  fs.copyFileSync(chartSource, chartDest);
  console.log('✓ Copied Chart.js');
} else {
  console.warn('⚠ Chart.js not found in node_modules');
}

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
