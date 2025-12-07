# AutoChat for Firefox

AutoChat is now available for Firefox! This guide will help you install and use AutoChat on Firefox.

## 🦊 Browser Compatibility

AutoChat supports:
- **Firefox**: Version 109.0 and later
- **Firefox Developer Edition**: Latest version
- **Firefox Nightly**: Latest version

## 📦 Installation Methods

### Method 1: Build from Source (Development)

1. **Clone the repository**:
```bash
git clone https://github.com/sushiomsky/autochat.git
cd autochat
```

2. **Install dependencies**:
```bash
npm install --legacy-peer-deps
```

3. **Build for Firefox**:
```bash
npm run build:firefox
```

4. **Load in Firefox**:
   - Open Firefox
   - Navigate to `about:debugging#/runtime/this-firefox`
   - Click "Load Temporary Add-on"
   - Select any file in the `dist-firefox` directory (e.g., `manifest.json`)

### Method 2: Install Production Build

1. **Download the Firefox build**:
   - Download `autochat-firefox-v4.5.2.zip` from releases

2. **Load in Firefox**:
   - Open Firefox
   - Navigate to `about:debugging#/runtime/this-firefox`
   - Click "Load Temporary Add-on"
   - Select the downloaded `.zip` file or extract it and select `manifest.json`

### Method 3: Firefox Add-ons (Coming Soon)

AutoChat will be published to Firefox Add-ons soon!

## 🔧 Firefox-Specific Features

### Browser API Compatibility

AutoChat uses the WebExtension API standard, which is compatible with both Chrome and Firefox. The Firefox build includes:

- **Manifest V2**: Firefox currently uses Manifest V2 (transitioning to V3)
- **Browser Namespace**: Uses `browser.*` API instead of `chrome.*`
- **Promise-based APIs**: All APIs return promises (no callbacks needed)

### Key Differences from Chrome Version

1. **Service Worker vs Background Scripts**:
   - Chrome: Uses service worker (`background.service_worker`)
   - Firefox: Uses background script (`background.scripts`)

2. **Action API**:
   - Chrome: Uses `chrome.action`
   - Firefox: Uses `browser.browserAction` (Manifest V2)

3. **Scripting API**:
   - Chrome: Uses `chrome.scripting.executeScript`
   - Firefox: Uses `browser.tabs.executeScript`

## 🚀 Building for Firefox

### Development Build

```bash
npm run build:firefox
```

This creates a development build in `dist-firefox/` with:
- Source maps enabled
- Debugging information
- Non-minified code

### Production Build

```bash
npm run build:firefox:prod
```

This creates a production build with:
- Minified code
- Optimized performance
- Removed comments and debug code

### Create Distribution Package

```bash
npm run package:firefox
```

This creates `autochat-firefox-v4.5.2.zip` ready for distribution.

## 🧪 Testing in Firefox

### Manual Testing

1. Build for Firefox: `npm run build:firefox`
2. Load in Firefox Developer Edition
3. Test all features:
   - Message sending
   - Auto-send scheduling
   - Webhooks
   - Settings persistence
   - Theme switching
   - Multi-language support

### Automated Testing

Tests run in Node.js environment and are browser-agnostic:

```bash
npm test
```

## 🐛 Firefox-Specific Issues

### Known Issues

1. **Temporary Add-on**: Development builds loaded via `about:debugging` are temporary and removed when Firefox restarts
   - Solution: Use web-ext for persistent development

2. **CSP Restrictions**: Content Security Policy is stricter in Firefox
   - All inline scripts are blocked
   - Use external script files only

3. **Storage Limitations**: Firefox has stricter storage quotas
   - Monitor storage usage
   - Clean up old data regularly

### Troubleshooting

#### Extension doesn't load
- Check Firefox version (must be 109.0+)
- Verify manifest.json is valid
- Check browser console for errors

#### Features not working
- Clear extension storage: `about:debugging` → Storage → Clear
- Check permissions in manifest
- Review browser console logs

#### Performance issues
- Disable other extensions temporarily
- Check Firefox Developer Tools Performance tab
- Reduce auto-send frequency

## 📚 Firefox Development Resources

- [WebExtensions API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)
- [Browser Compatibility](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Browser_support_for_JavaScript_APIs)
- [Porting from Chrome](https://extensionworkshop.com/documentation/develop/porting-a-google-chrome-extension/)
- [web-ext CLI](https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/)

## 🔄 Migration from Chrome

AutoChat maintains feature parity between Chrome and Firefox. Your settings and data can be transferred:

### Export from Chrome
1. Open AutoChat in Chrome
2. Go to Settings
3. Click "Export Settings"
4. Save the JSON file

### Import to Firefox
1. Open AutoChat in Firefox
2. Go to Settings
3. Click "Import Settings"
4. Select the exported JSON file

## 🆘 Support

Having issues with the Firefox version?

- **GitHub Issues**: [Report a bug](https://github.com/sushiomsky/autochat/issues)
- **Documentation**: [Full documentation](https://github.com/sushiomsky/autochat)
- **Community**: Join our discussions

## 📝 Version History

### v4.5.2 (Current)
- ✅ Firefox Manifest V2 support
- ✅ Full feature parity with Chrome
- ✅ Automated build system
- ✅ Browser API compatibility layer

### v4.5.1
- ✅ Firefox Manifest V2 support
- ✅ Full feature parity with Chrome
- ✅ Webhook integration
- ✅ Human-like imperfections
- ✅ Crypto donations
- ✅ Natural language phrases

### Future Plans
- 🔜 Firefox Add-ons publication
- 🔜 Manifest V3 migration (when Firefox fully supports it)
- 🔜 Firefox-specific optimizations

## 🎯 Next Steps

1. **Try it out**: Load the extension in Firefox
2. **Report issues**: Help us improve Firefox compatibility
3. **Contribute**: Submit PRs for Firefox-specific improvements

---

**Note**: AutoChat for Firefox is in active development. While we strive for full feature parity, some advanced features may behave differently due to browser API differences.
