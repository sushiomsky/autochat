# AutoChat Enhanced - Quick Start Guide

## For Users

### Installation

1. **Download the extension**
   - Clone from GitHub: `git clone https://github.com/sushiomsky/autochat.git`
   - Or download the latest release .zip

2. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (top-right toggle)
   - Click "Load unpacked"
   - Select the project directory (or `dist/` if you built it)

3. **Start Using**
   - Click the AutoChat icon in your toolbar
   - Click "Mark Chat Input Field"
   - Click on any text input on a webpage
   - Add your messages (one per line)
   - Click "Start Auto-Send"

### Quick Tips

- **Dark Mode**: Click the 🌙 icon in the top-right
- **Command Palette**: Press Ctrl+K for quick access to all features
- **Keyboard Shortcuts**: Ctrl+S (save), Ctrl+X (start/stop), Ctrl+P (pause)
- **Template Variables**: Use `{time}`, `{date}`, `{random_emoji}` in messages
- **Settings**: Click ⚙️ for advanced options like typing simulation
- **Analytics**: View stats in the dashboard
- **Notifications**: Click 🔔 bell icon to view notification history
- **Emojis**: Click 😊 to open emoji picker (200+ emojis)
- **Preview**: Click 👁️ to preview messages before sending
- **Categories**: Organize messages with custom categories
- **Help**: Click ❓ for in-app documentation

## For Developers

### First-Time Setup

```bash
# Clone the repository
git clone https://github.com/sushiomsky/autochat.git
cd autochat

# Install dependencies
npm install

# Build the extension
npm run build

# The built extension is in dist/
```

### Development Workflow

```bash
# Start watch mode (auto-rebuild on file changes)
npm run watch

# In another terminal, run tests
npm run test:watch

# Check code quality
npm run lint
npm run format:check
```

### Testing Your Changes

1. Make your code changes
2. Run `npm run build` to rebuild
3. In Chrome, go to `chrome://extensions/`
4. Click the reload icon on the AutoChat card
5. Test your changes in the extension popup

### Before Committing

```bash
# Format code
npm run format

# Fix linting issues
npm run lint:fix

# Run all tests
npm test

# Verify build works
npm run build
```

### Creating a Release

```bash
# Build for production (minified)
npm run build:prod

# Create distribution package
npm run package

# This creates autochat-v4.1.zip in the root directory
```

## Common Tasks

### Adding a New Feature

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes in relevant files
3. Add tests in `tests/`
4. Update documentation
5. Run tests: `npm test`
6. Commit: `git commit -m "feat: add my feature"`
7. Push and create PR

### Fixing a Bug

1. Create fix branch: `git checkout -b fix/bug-description`
2. Write a failing test that reproduces the bug
3. Fix the bug
4. Verify test passes
5. Commit: `git commit -m "fix: resolve bug description"`
6. Push and create PR

### Updating Dependencies

```bash
# Check for outdated packages
npm outdated

# Update all dependencies
npm update

# Or update specific package
npm update package-name

# Test everything still works
npm test
npm run build
```

## Troubleshooting

### Jest not found

```bash
# Install dependencies
npm install

# If that doesn't work, try
npm ci
```

### Build fails

```bash
# Clean and rebuild
npm run clean
npm install
npm run build
```

### Extension not loading in Chrome

1. Check manifest.json is valid
2. Ensure all required files exist in dist/
3. Look for errors in `chrome://extensions/` developer mode
4. Try reloading the extension
5. Check browser console for errors

### Tests failing

```bash
# Clear cache and re-run
npm run clean
npm install
npm test
```

### Linting errors

```bash
# Auto-fix most issues
npm run lint:fix

# Check what needs manual fixing
npm run lint
```

## File Locations

- **Source Code**: Root directory (`.js`, `.html`, `.css`)
- **Built Extension**: `dist/` directory
- **Tests**: `tests/` directory
- **Build Scripts**: `scripts/` directory
- **Documentation**: `*.md` files in root

## Environment Setup

### VS Code (Recommended)

Install extensions:

- ESLint
- Prettier
- EditorConfig

Settings will auto-apply from `.vscode/settings.json` (if created)

### Other Editors

EditorConfig settings in `.editorconfig` will work with most modern editors.

## Getting Help

- **Documentation**: Read the README.md
- **Contributing Guide**: See CONTRIBUTING.md
- **Issues**: Check existing issues on GitHub
- **Discussions**: Ask questions in GitHub Discussions

## Next Steps

### For Users

1. **Explore v4.4 Features**:
   - Press Ctrl+K to try the Command Palette
   - Click 🔔 to view Notification Center
   - Click 😊 to use the Emoji Picker
   - Click 👁️ to Preview messages
   - Open Categories manager to organize messages
2. **Configure Settings** (⚙️ button):
   - Enable typing simulation for realistic sending
   - Set active hours (e.g., 9 AM - 5 PM)
   - Configure daily limits (e.g., 50 messages/day)
   - Enable/disable notifications and sounds
3. **Try Dark Mode** (🌙 button)
4. **Export Settings** as backup (Settings → Export)
5. **Read Full Docs**:
   - [KEYBOARD_SHORTCUTS.md](KEYBOARD_SHORTCUTS.md) - All shortcuts
   - [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues
   - [MULTI_ACCOUNT_FEATURE.md](MULTI_ACCOUNT_FEATURE.md) - Account management

### For Developers

1. **Read Documentation**:
   - [CONTRIBUTING.md](CONTRIBUTING.md) - Development guidelines
   - [KEYBOARD_SHORTCUTS.md](KEYBOARD_SHORTCUTS.md) - Shortcuts reference
   - [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Debug guide
2. **Explore v4.4 Code**:
   - `popup-enhanced.js` - UI and all modals (lines 1023-1302 for new features)
   - `src/notifications.js` - Notification manager with history
   - `tests/unit/` - 125 passing tests covering all features
3. **Run Test Suite**: `npm test` (all 125 tests should pass)
4. **Try Adding Features**: Check [TODO.md](TODO.md) for ideas
5. **Submit Your First PR**: Fix a small issue or improve documentation

## Key Commands Reference

```bash
# Installation
npm install              # Install dependencies

# Development
npm run build           # Build extension
npm run watch           # Auto-rebuild on changes
npm test                # Run tests
npm run test:watch      # Run tests in watch mode

# Code Quality
npm run lint            # Check code style
npm run lint:fix        # Auto-fix style issues
npm run format          # Format all files
npm run format:check    # Check formatting

# Production
npm run build:prod      # Production build (minified)
npm run package         # Create distribution .zip

# Maintenance
npm run clean           # Remove build artifacts
npm outdated            # Check for updates
npm update              # Update dependencies
```

## Support

Need help? Check:

1. README.md - Full documentation
2. CONTRIBUTING.md - Development guide
3. GitHub Issues - Known issues and solutions
4. GitHub Discussions - Community Q&A

---

**Ready to start? Run `npm install && npm run build` and you're good to go!** 🚀
