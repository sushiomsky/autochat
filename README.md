# AutoChat Enhanced - Advanced Automated Message Sender

A powerful Chrome extension that automatically sends messages to chat applications with advanced features including typing simulation, anti-detection, analytics, and intelligent scheduling.

## Features

### Core Features
- 🎯 **Easy Setup**: Click to mark any text input field on any website
- 📝 **Multiple Messages**: Enter a list of messages to rotate through
- 🔀 **Two Send Modes**:
  - **Random**: Randomly selects messages from your list
  - **Sequential**: Sends messages in order, then loops back
- ⏱️ **Smart Timing**: Set min/max intervals with random timing between sends
- 💾 **Auto-Save**: All settings automatically persist between sessions
- 🌐 **Universal**: Works on any chat website (Discord, WhatsApp Web, Telegram, etc.)
- 🌍 **Multi-Language**: Full internationalization with English, Urdu (اردو), and Spanish (Español) support
- 📚 **Language-Specific Phrases**: 300-671 farming phrases in each supported language

### Advanced Features (v4.0+)
- ⌨️ **Typing Simulation**: Realistic typing speed (40-80 WPM) with character-by-character animation
- 🎭 **Anti-Detection**: Variable delays, anti-repetition, and human-like behavior patterns
- 📊 **Analytics Dashboard**: Track messages sent today, total messages, and activity status
- 🕐 **Active Hours**: Schedule messages only during specific hours
- 🔢 **Daily Limits**: Set maximum messages per day to prevent spam detection
- 📝 **Template Variables**: Dynamic content with {time}, {date}, {random_emoji}, {random_number}
- 🔄 **Anti-Repetition**: Intelligent message selection to avoid sending the same message repeatedly
- ⚡ **Variable Delays**: Random "thinking time" before typing (0.5-2 seconds)
- 🔄 **Retry Logic**: Automatic retry up to 3 times if sending fails
- 💾 **Import/Export**: Backup and restore all settings
- 🎨 **Modern UI**: Beautiful gradient design with intuitive controls
- 📛 **Status Badge**: Visual indicator when auto-send is active
- 🌍 **i18n Support**: Full localization with RTL support for Urdu and other languages
- 🗣️ **Smart Phrase Loading**: Automatically loads phrases in your preferred language with English fallback

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right corner)
4. Click "Load unpacked"
5. Select the `autochat` folder

## Usage

### Initial Setup

1. **Open the extension popup** by clicking the AutoChat icon
2. **Click "Mark Chat Input Field"** button
3. **Click on the text input** where you want messages sent
   - A green highlight will appear on hover
   - The field will be saved automatically

### Configure Messages

1. **Enter your messages** in the textarea (one per line)
   ```
   Hello!
   How are you?
   Nice to meet you
   ```

2. **Choose send mode**:
   - **Random order**: Picks a random message each time
   - **Sequential order**: Sends messages in order

3. **Set time intervals**:
   - **Min**: Minimum seconds before next message (e.g., 60)
   - **Max**: Maximum seconds before next message (e.g., 120)
   - The extension will wait a random time between these values

### Start Sending

- **Start Auto-Send**: Begins automatic message sending
- **Stop Auto-Send**: Stops the automation
- **Send Random Message Once**: Sends one message immediately for testing

## Example Use Cases

- Keep chat conversations active
- Regular reminders or notifications
- Testing chat applications
- Automated responses in controlled environments

## Settings Persistence

All settings are automatically saved:
- Marked input field selector
- Message list
- Send mode (random/sequential)
- Min/max interval times

## Multi-Language Support

AutoChat now includes language-specific farming phrase libraries:

- **English (en)**: 671+ original phrases with casino and gaming humor
- **Urdu (ur)**: 300+ culturally adapted phrases for Urdu-speaking users
- **Spanish (es)**: 300+ Spanish translations with relevant humor

The extension automatically loads phrases in your preferred language:
1. Select your language from the dropdown in the extension
2. Phrases load automatically based on your selection
3. Falls back to English if your language isn't available yet

For more details, see [MULTI_LANGUAGE_PHRASES.md](MULTI_LANGUAGE_PHRASES.md).

## Technical Details

- Built with Chrome Extension Manifest V3
- Service worker for background badge management
- CSS selector-based input field detection with retry logic
- Supports standard inputs, textareas, and contenteditable elements
- Multiple send methods (Enter key + button click detection)
- Realistic typing simulation (character-by-character with variable WPM)
- Template variable processing for dynamic content
- Anti-repetition algorithm with recent message tracking
- Active hours validation with timezone support
- Daily limit enforcement with automatic reset
- Local storage for persistence with import/export capability
- Language-specific phrase loading with automatic fallback

## Permissions

- `scripting`: To inject content script for automation
- `activeTab`: To interact with the current page
- `storage`: To save settings
- `host_permissions`: To work on all websites

## Files

- `manifest.json`: Extension configuration
- `background.js`: Service worker for badge management and stats
- `content-enhanced.js`: Advanced automation logic with typing simulation
- `popup-enhanced.html`: Modern popup interface
- `popup-enhanced.js`: Enhanced UI controller with analytics
- `styles.css`: Beautiful gradient styling
- `content.js`, `popup.js`, `popup.html`: Legacy files (v3.0)
- `farming_phrases.txt`: Default message library (1000+ phrases)

## Version

**v4.3 Localization Edition** - Current release with:
- 🌍 **Internationalization**: Full i18n support with English and Urdu (اردو)
- ↔️ **RTL Support**: Complete Right-to-Left layout for Arabic script languages
- 🔄 **Language Switcher**: Easy language selection with live updates
- 🎨 **Localized Fonts**: Beautiful Urdu/Nastaliq font rendering

**v4.2 Feature Complete Edition** - Previous release with:
- 🔔 **Browser Notifications**: Desktop alerts for all events
- 👁️ **Message Preview**: Test messages before sending with dry-run mode
- 📁 **Phrase Categories**: Organize messages with 10 default categories and custom tags
- ⚡ **Command Palette**: Instant access to all features with Ctrl+K
- 😊 **Emoji Picker**: 300+ emojis organized and searchable
- 🧪 **75 Tests Passing**: Comprehensive test coverage
- 📚 **Complete API**: Well-documented module APIs

**v4.1 Professional Edition** - Previous release with:
- 🌙 Dark mode support with theme toggle
- ⌨️ Keyboard shortcuts (Ctrl+S/X/P)
- ⏸️ Pause/Resume functionality
- 💾 Analytics export (JSON backup)
- 🧪 Comprehensive test suite (Jest)
- 🔧 Professional build system (npm)
- 🔒 Enhanced security (input validation, XSS protection)
- ⚡ Performance optimizations (debouncing, lazy loading)
- ♿ Accessibility improvements (ARIA labels, focus management)
- 📚 Complete developer documentation

**v4.0 Enhanced Edition** - Major upgrade with:
- Typing simulation and anti-detection features
- Analytics and statistics tracking
- Advanced scheduling (active hours, daily limits)
- Template variables for dynamic content
- Retry logic and improved reliability
- Modern UI with gradient design
- Import/Export settings

**v3.0** - Complete rewrite focused on message automation

## Release Notes

See [LOCALIZATION.md](LOCALIZATION.md) for i18n documentation and translation guide.
See [RELEASE_NOTES_v4.2.md](RELEASE_NOTES_v4.2.md) for v4.2 changelog.
See [RELEASE_NOTES_v4.1.md](RELEASE_NOTES_v4.1.md) for v4.1 changelog.

## Roadmap

### v4.4 (Next)
- [ ] More languages (Arabic, Spanish, French, Hindi)
- [ ] Visual improvements and animations
- [ ] User onboarding tutorial
- [ ] More keyboard shortcuts
- [ ] Analytics dashboard with charts

### v4.5 (Planned)
- [ ] Firefox port (WebExtensions)
- [ ] Advanced scheduling calendar
- [ ] Webhook integration
- [ ] Performance monitoring dashboard
- [ ] Cloud sync (optional)

### v5.0 (Future)
- [ ] Cloud sync (optional)
- [ ] Message templates library
- [ ] AI-powered message generation
- [ ] Team collaboration features

## License

MIT License - Feel free to use and modify. See [LICENSE](LICENSE) for details.

## Keyboard Shortcuts

Quick access to common actions:
- **Ctrl+K**: Open Command Palette (NEW!)
- **Ctrl+S**: Start Auto-Send
- **Ctrl+X**: Stop Auto-Send
- **Ctrl+P**: Pause/Resume Auto-Send
- **Escape**: Close open modals
- **↑↓**: Navigate command palette
- **Enter**: Execute selected command

## Configuration Options

### Basic Settings
- **Send Mode**: Random or Sequential
- **Time Interval**: Min/Max seconds between messages
- **Messages**: One per line, supports template variables

### Advanced Settings
- **Typing Simulation**: Enable/disable realistic typing animation
- **Variable Delays**: Random "thinking time" before typing
- **Anti-Repetition**: Prevent sending same message repeatedly
- **Template Variables**: Enable dynamic content replacement
- **Daily Limit**: Maximum messages per day (0 = unlimited)
- **Active Hours**: Only send during specified time range

### Template Variables
- `{time}` - Current time (e.g., "2:30:45 PM")
- `{date}` - Current date (e.g., "10/18/2025")
- `{random_emoji}` - Random emoji from preset list
- `{random_number}` - Random number 0-99
- `{timestamp}` - Unix timestamp

### Theme
- **Light Mode**: Default clean interface
- **Dark Mode**: Eye-friendly dark theme (click 🌙 icon)
- **Auto-Persist**: Theme preference saved across sessions

### Analytics
- Messages sent today (resets at midnight)
- Total messages sent (all-time)
- Auto-send status indicator
- Reset statistics option

## Notes

⚠️ **Important**: Use this extension responsibly. Automated messaging may violate terms of service on some platforms. This tool is intended for personal use, testing, and controlled environments only.

### Best Practices for Avoiding Detection
1. Enable typing simulation for realistic appearance
2. Use variable delays to mimic human behavior
3. Set reasonable time intervals (60-180 seconds recommended)
4. Enable anti-repetition to avoid spam patterns
5. Use template variables for dynamic content
6. Set daily limits to prevent excessive sending
7. Configure active hours to match normal usage patterns

## Development

### Setup
```bash
git clone https://github.com/sushiomsky/autochat.git
cd autochat
npm install
```

### Commands
```bash
npm test              # Run tests
npm run lint          # Check code style
npm run format        # Format code
npm run build         # Development build
npm run build:prod    # Production build
npm run watch         # Watch mode
npm run package       # Create .zip for store
```

### Testing
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report
```

### Contributing
See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### File Structure
```
autochat/
├── src/                    # Source utilities
├── tests/                  # Test suite
├── scripts/                # Build scripts
├── content-enhanced.js     # Main automation logic
├── popup-enhanced.js       # UI controller
├── popup-enhanced.html     # User interface
├── background.js           # Service worker
├── styles.css              # Styling (with dark mode)
└── manifest.json           # Extension config
```

## Localization

AutoCh supports multiple languages:

- **English** - Default language
- **Urdu (اردو)** - Full RTL support with Nastaliq fonts

Want to add your language? See [LOCALIZATION.md](LOCALIZATION.md) for the translation guide.

## Support

For issues or questions:
- **Issues**: [GitHub Issues](https://github.com/sushiomsky/autochat/issues)
- **Discussions**: [GitHub Discussions](https://github.com/sushiomsky/autochat/discussions)
- **Contributing**: See [CONTRIBUTING.md](CONTRIBUTING.md)
- **Translations**: See [LOCALIZATION.md](LOCALIZATION.md)

---
