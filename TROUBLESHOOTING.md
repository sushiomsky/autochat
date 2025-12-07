# AutoChat Troubleshooting Guide

Common issues and solutions for AutoChat Enhanced.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Input Field Detection](#input-field-detection)
- [Message Sending Problems](#message-sending-problems)
- [Typing Simulation Issues](#typing-simulation-issues)
- [Settings & Storage](#settings--storage)
- [Performance Issues](#performance-issues)
- [UI & Display Problems](#ui--display-problems)
- [Language & Localization](#language--localization)
- [Multi-Account Issues](#multi-account-issues)
- [Browser Compatibility](#browser-compatibility)
- [Advanced Debugging](#advanced-debugging)

---

## Installation Issues

### Extension Won't Load

**Symptoms**: Error when loading unpacked extension

**Solutions**:
1. Ensure you're loading the correct folder (should contain `manifest.json`)
2. Check Chrome version (requires Chrome 88+)
3. Enable "Developer mode" in chrome://extensions
4. Try reloading the extension
5. Check console for specific error messages

```bash
# If building from source
npm install
npm run build
# Load the 'dist' folder, not the root folder
```

### Build Errors

**Symptoms**: `npm run build` fails

**Solutions**:
1. Delete `node_modules` and `package-lock.json`
2. Run `npm install` (use `--legacy-peer-deps` if needed)
3. Ensure Node.js version 14+ is installed
4. Check for disk space
5. Review error messages for specific package issues

---

## Input Field Detection

### Can't Mark Input Field

**Symptoms**: Green highlight doesn't appear, clicking does nothing

**Solutions**:

1. **Check page is fully loaded**
   - Wait for page to finish loading completely
   - Some chat apps load input fields dynamically

2. **Try different selector**
   - Look for textareas or contenteditable divs
   - Some sites use custom input components

3. **Refresh and retry**
   ```javascript
   // In console, check if field exists:
   document.querySelector('textarea')
   document.querySelector('[contenteditable="true"]')
   ```

4. **Check for iframes**
   - Extension can't access iframe content
   - Some chat apps use iframes (limited support)

### Input Field Not Saved

**Symptoms**: Field selector disappears after closing popup

**Solutions**:
1. Click "Mark Chat Input Field" button
2. Wait for green highlight on hover
3. Click the actual input field
4. Check "Input Status" shows green checkmark
5. Verify chrome.storage permissions are granted

---

## Message Sending Problems

### Messages Not Sending

**Symptoms**: Auto-send starts but no messages appear

**Solutions**:

1. **Verify input field is marked correctly**
   - Status should show green checkmark
   - Try remarking the field

2. **Check send method**
   - "Press Enter key" - default, works most places
   - "Click a Send button" - for sites without Enter support
   - Try switching between methods

3. **Check if messages are empty**
   - Ensure message list has content
   - Check for special characters causing issues

4. **Website interference**
   - Some sites detect automation
   - Try slower intervals (300-600 seconds)
   - Enable typing simulation
   - Use variable delays

5. **Browser permissions**
   - Check site permissions in chrome://extensions
   - Ensure "Allow on all sites" is enabled

### Send Button Not Detected

**Symptoms**: "Click a Send button" method doesn't work

**Solutions**:
1. Switch send method to "Click a Send button"
2. Click "Mark Send Button"
3. Hover over send button (should highlight green)
4. Click the button to save selector
5. Verify button selector is saved

Common send button selectors:
- `button[type="submit"]`
- `.send-button`
- `[aria-label="Send"]`

### Messages Send Too Fast

**Symptoms**: Getting rate limited or detected

**Solutions**:
1. Increase minimum interval (try 120+ seconds)
2. Increase maximum interval (try 300+ seconds)
3. Enable typing simulation (40-80 WPM)
4. Enable variable delays (0.5-2 seconds)
5. Set daily limits (20-50 messages/day)
6. Configure active hours (business hours only)

---

## Typing Simulation Issues

### Typing Too Fast/Slow

**Symptoms**: Characters appear unrealistically

**Solutions**:
1. Default is 40-80 WPM (Words Per Minute)
2. Adjust in settings if available
3. Clear browser cache
4. Reload extension

### Typing Simulation Disabled

**Symptoms**: Messages paste instantly

**Solutions**:
1. Open Settings
2. Check "Enable Typing Simulation"
3. Save settings
4. Restart auto-send

---

## Settings & Storage

### Settings Not Saving

**Symptoms**: Changes disappear after closing popup

**Solutions**:

1. **Check storage permissions**
   ```javascript
   // In popup console:
   chrome.storage.local.get(null, console.log)
   ```

2. **Storage quota**
   - Check if storage is full
   - Export settings and clear data
   - Re-import after clearing

3. **Browser sync issues**
   - Disable sync if enabled
   - Use local storage only
   - Check chrome://sync-internals

4. **Manual save**
   - Press `Ctrl+S` to force save
   - Export settings as backup

### Can't Import Settings

**Symptoms**: Import button does nothing or shows error

**Solutions**:
1. Verify JSON file is valid
2. Check file encoding (should be UTF-8)
3. Ensure file was exported from same or newer version
4. Try smaller settings file
5. Check browser console for errors

### Export Settings Not Working

**Symptoms**: Export button doesn't download file

**Solutions**:
1. Check download permissions
2. Try different browser
3. Copy settings from storage manually:
   ```javascript
   chrome.storage.local.get(null, data => {
     console.log(JSON.stringify(data, null, 2));
   });
   ```

---

## Performance Issues

### Extension Slows Down Browser

**Symptoms**: Chrome lags when extension is active

**Solutions**:
1. Reduce message list size (< 1000 messages)
2. Increase interval between sends
3. Close other tabs
4. Clear browser cache
5. Disable other extensions
6. Check Chrome Task Manager (Shift+Esc)

### High Memory Usage

**Symptoms**: Extension uses excessive RAM

**Solutions**:
1. Reload extension
2. Clear notification history
3. Reduce phrase library size
4. Export and reimport settings
5. Check for memory leaks in console

---

## UI & Display Problems

### Dark Mode Not Working

**Symptoms**: Theme toggle doesn't change colors

**Solutions**:
1. Click theme toggle button (🌙/☀️)
2. Close and reopen popup
3. Check if system theme is interfering
4. Clear browser cache
5. Reload extension

### Modal Won't Close

**Symptoms**: Can't close settings or other modals

**Solutions**:
1. Press `Escape` key
2. Click outside modal
3. Click X or Close button
4. Reload popup
5. Check for JavaScript errors in console

### Notification Badge Stuck

**Symptoms**: Bell icon shows wrong count

**Solutions**:
1. Open Notification Center
2. Click "Mark All Read"
3. Close and reopen popup
4. Clear notification history
5. Reload extension

### UI Elements Missing

**Symptoms**: Buttons or sections not visible

**Solutions**:
1. Reload popup
2. Resize popup window
3. Check zoom level (should be 100%)
4. Clear browser cache
5. Reinstall extension

---

## Language & Localization

### Wrong Language Displayed

**Symptoms**: UI shows wrong language

**Solutions**:
1. Click language dropdown
2. Select correct language (English, Urdu, Spanish)
3. Settings auto-save
4. Reload popup if needed

### Phrases Not Loading

**Symptoms**: Default phrases don't appear

**Solutions**:
1. Check internet connection
2. Verify phrase files exist in extension
3. Look for errors in browser console
4. Try different language
5. Reload extension

### RTL Layout Issues (Urdu)

**Symptoms**: Right-to-left text displays incorrectly

**Solutions**:
1. Select Urdu from language dropdown
2. Ensure browser supports RTL
3. Check font rendering
4. Clear cache and reload
5. Try different browser

---

## Multi-Account Issues

### Can't Switch Accounts

**Symptoms**: Account dropdown doesn't work

**Solutions**:
1. Click ⚙️ button next to account dropdown
2. Create at least 2 profiles
3. Select from dropdown
4. Settings should load automatically
5. Check console for errors

### Account Settings Not Separate

**Symptoms**: All accounts share settings

**Solutions**:
1. Ensure each account has unique name
2. Check storage for account data:
   ```javascript
   chrome.storage.local.get(['accounts'], console.log)
   ```
3. Export account settings separately
4. Reload extension

---

## Browser Compatibility

### Chrome Version Issues

**Minimum Requirements**:
- Chrome 88+ (Manifest V3 support)
- Edge 88+ (Chromium-based)
- Opera 74+ (Chromium-based)
- Brave 1.20+ (Chromium-based)

**Not Supported**:
- Firefox (WebExtensions port coming in v4.5)
- Safari (not planned)
- Chrome < 88

### Site-Specific Issues

#### Discord
- Use "Press Enter key" method
- May need to mark `[contenteditable]` div
- Rate limiting is aggressive (increase intervals)

#### WhatsApp Web
- Works best with default settings
- Use "Press Enter key"
- Mark the `contenteditable` div

#### Telegram Web
- Use "Press Enter key"
- May detect automation (use slower intervals)
- Enable typing simulation

#### Slack
- Use "Press Enter key"
- Works in DMs and channels
- May need to mark `contenteditable` div

---

## Advanced Debugging

### Enable Debug Mode

1. Open Chrome DevTools (F12)
2. Go to Console tab
3. Enable verbose logging:
   ```javascript
   localStorage.setItem('autoChat_debug', 'true');
   ```

### Check Extension Logs

```javascript
// In popup console:
chrome.runtime.getBackgroundPage(bg => {
  console.log(bg.console);
});
```

### Inspect Content Script

1. Open page with chat
2. Press F12
3. Go to Console
4. Check for content script messages
5. Look for errors in red

### View Storage Data

```javascript
// Get all storage
chrome.storage.local.get(null, data => {
  console.log(JSON.stringify(data, null, 2));
});

// Get specific key
chrome.storage.local.get(['messages', 'inputSelector'], console.log);
```

### Clear All Data

**Warning**: This deletes all settings!

```javascript
chrome.storage.local.clear(() => {
  console.log('All data cleared');
  location.reload();
});
```

### Check Extension Permissions

1. Go to chrome://extensions
2. Click "Details" on AutoChat
3. Check "Site access"
4. Ensure "On all sites" is selected

### Network Issues

```javascript
// Check if extension can access URLs
fetch(chrome.runtime.getURL('farming_phrases_en.txt'))
  .then(r => r.text())
  .then(console.log)
  .catch(console.error);
```

---

## Getting Help

### Before Asking for Help

1. Check this troubleshooting guide
2. Read the [README.md](README.md)
3. Review [KEYBOARD_SHORTCUTS.md](KEYBOARD_SHORTCUTS.md)
4. Search existing GitHub issues
5. Try basic debugging steps above

### When Reporting Issues

Include the following information:

1. **Version**: Check manifest.json or popup header
2. **Browser**: Chrome/Edge/Brave version
3. **OS**: Windows/Mac/Linux
4. **Website**: Which chat site you're using
5. **Error Messages**: Console errors (F12)
6. **Steps to Reproduce**: What you did before error
7. **Expected vs Actual**: What should happen vs what does
8. **Screenshots**: Visual issues need images

### Where to Get Help

- **GitHub Issues**: https://github.com/sushiomsky/autochat/issues
- **Discussions**: https://github.com/sushiomsky/autochat/discussions (if enabled on repository)
- **Documentation**: [README.md](README.md)

---

## Known Issues

### Current Limitations

1. **iframes**: Limited support for iframe-embedded chats
2. **Shadow DOM**: Some modern frameworks use shadow DOM (limited support)
3. **Rate Limiting**: Aggressive rate limits on some platforms
4. **Detection**: Advanced anti-bot systems may detect automation
5. **Mobile**: Chrome mobile extension support is limited

### Workarounds

1. **Rate Limits**: Increase intervals, use active hours
2. **Detection**: Enable typing simulation, use variable delays
3. **iframes**: May need browser extension for iframe access
4. **Shadow DOM**: Open issue if you encounter this

---

## FAQ

### Q: Why do my messages send instantly?
**A**: Typing simulation might be disabled. Enable it in Settings.

### Q: Can I use on multiple sites simultaneously?
**A**: Yes, each tab runs independently. Use multi-account profiles.

### Q: Will this work on mobile?
**A**: Not currently. Mobile app planned for v5.0.

### Q: Is this detectable?
**A**: Advanced systems may detect automation. Use realistic intervals and typing simulation.

### Q: Can I schedule messages for specific times?
**A**: Yes, use Active Hours feature. Advanced scheduling coming in v4.5.

### Q: How do I backup my settings?
**A**: Use Import/Export feature in Settings modal or Command Palette.

---

## Version-Specific Issues

### v4.4.0 Known Issues
- None reported yet

### v4.3.0 Known Issues
- Some RTL fonts may not render on older systems
- Language detection might default to English on first load

### v4.2.0 Known Issues
- Notification sound might not play on some systems
- Category manager doesn't filter phrases yet (planned)

---

**Last Updated**: December 7, 2025  
**Version**: v4.4.0  
**Need More Help?**: Open an issue on GitHub with details

## See Also

- [README.md](README.md) - Main documentation
- [KEYBOARD_SHORTCUTS.md](KEYBOARD_SHORTCUTS.md) - Keyboard reference
- [CONTRIBUTING.md](CONTRIBUTING.md) - Development guide
- [CHANGELOG.md](CHANGELOG.md) - Version history
