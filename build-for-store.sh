#!/bin/bash
# Build script for Chrome Web Store submission

echo "🔨 Building AutoChat v4.0 for Chrome Web Store..."

# Create build directory
mkdir -p build
rm -rf build/*

# Copy essential files
echo "📦 Copying extension files..."
cp manifest.json build/
cp background.js build/
cp content-enhanced.js build/
cp popup-enhanced.html build/
cp popup-enhanced.js build/
cp styles.css build/
cp farming_phrases.txt build/
cp icon16.png build/
cp icon32.png build/
cp icon48.png build/

# Copy legacy files for backward compatibility
cp content.js build/
cp popup.js build/
cp popup.html build/

echo "✅ Build complete! Files are in ./build/ directory"
echo ""
echo "Next steps:"
echo "1. Create a ZIP file from the build directory"
echo "2. Go to: https://chrome.google.com/webstore/devconsole"
echo "3. Upload the ZIP file"
echo ""
echo "To create ZIP (if you have zip installed):"
echo "  cd build && zip -r ../autochat-v4.0.zip . && cd .."
echo ""
echo "Or manually:"
echo "  1. Open the build/ folder"
echo "  2. Select all files"
echo "  3. Right-click > Compress/Create Archive"
echo "  4. Name it autochat-v4.0.zip"
