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
- 🎯 **Mention Detection**: Auto-reply when someone mentions you in chat
- 👥 **Multi-Account Support**: Manage multiple profiles with separate settings

### New in v4.4 (UI Polish Edition) ✨
- 🔔 **Notification Center**: In-app notification history with full management (view, mark as read, delete)
- 📁 **Category Manager**: Create and manage custom message categories with icons and colors
- ⌨️ **Command Palette**: Quick access to all features with Ctrl+K keyboard shortcut
- 😊 **Emoji Picker**: Built-in emoji selector with 200+ emojis in 8 categories
- 👁️ **Preview Mode**: Preview messages with template variables before sending
- ❓ **Help Documentation**: Comprehensive in-app help with guides and keyboard shortcuts
- 🎨 **Enhanced UI**: Improved button layouts, notification badges, and visual polish

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
- **Auto-reply when mentioned**: Respond automatically when someone tags you with @mention

### Using Mention Detection

1. **Mark the message container** (📌 Mark Message Container button)
2. **Open Settings** (⚙️ Settings button)
3. **Enable "Auto-Reply to Mentions"**
4. **Add keywords to watch** (e.g., @username, your name)
5. **Add reply messages** (e.g., "Thanks!", "I'm here!")

The extension will now automatically reply when someone mentions you. See [MENTION_DETECTION_FEATURE.md](MENTION_DETECTION_FEATURE.md) for detailed documentation.

### Using Multi-Account Support (NEW!)

Perfect for managing multiple casino accounts or different automation scenarios!

1. **Click the ⚙️ button** next to "Account Profile" dropdown
2. **Create new profile** with a descriptive name (e.g., "Casino Account 1")
3. **Configure settings** for this profile (messages, keywords, intervals)
4. **Switch between profiles** using the dropdown

Each profile stores completely separate settings. See [MULTI_ACCOUNT_FEATURE.md](MULTI_ACCOUNT_FEATURE.md) for detailed documentation.

### Using v4.4 UI Features

#### Notification Center 🔔
1. **Click the bell icon** (🔔) in the header
2. **View notification history** - see all past messages, errors, and achievements
3. **Mark as read** - individual notifications or mark all read
4. **Delete notifications** - remove individual items or clear all
5. **Unread badge** - shows count of unread notifications

#### Command Palette ⌨️
1. **Press Ctrl+K** or click the keyboard icon
2. **Type to search** commands (e.g., "start", "stop", "settings")
3. **Arrow keys** to navigate, **Enter** to execute
4. **Quick access** to all major features without clicking through menus

#### Emoji Picker 😊
1. **Click the emoji button** (😊)
2. **Browse categories** - Smileys, Hearts, Animals, Food, Sports, Objects, Symbols
3. **Search emojis** with the search bar
4. **Click to insert** - adds emoji to your message list

#### Preview Mode 👁️
1. **Click Preview button** before sending
2. **See rendered messages** with all template variables replaced
3. **Check first 10 messages** to verify they look correct
4. **Test variables** like {time}, {date}, {random_emoji} before going live

#### Category Manager 📁
1. **Open Categories** from the main interface
2. **Create custom categories** with name, icon (emoji), and color
3. **View category statistics** - see how many phrases in each category
4. **Organize messages** by category for better management

#### Help Documentation ❓
1. **Click Help button** (❓) for in-app assistance
2. **Getting Started guide** - step-by-step setup instructions
3. **Template Variables reference** - all available variables explained
4. **Keyboard Shortcuts** - complete list of hotkeys
5. **Advanced Features** - detailed explanations of all capabilities

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

**v4.4.0 UI Polish Edition** - Current release with:
- 🔔 **Notification Center**: Complete notification history management
- 📁 **Category Manager**: Create and organize custom message categories
- ⌨️ **Command Palette**: Quick access to all features (Ctrl+K)
- 😊 **Emoji Picker**: Built-in emoji selection with 200+ emojis
- 👁️ **Preview Mode**: Test messages before sending
- ❓ **Help System**: Comprehensive in-app documentation
- 🎨 **UI Enhancements**: Improved layouts, badges, and polish

**Previous releases:**
- **v4.3**: Multi-language support with English, Urdu (اردو), and Spanish (Español)
- **v4.2**: Enhanced features and stability improvements  
- **v4.1**: Dark mode, keyboard shortcuts, pause/resume
- **v4.0**: Typing simulation, anti-detection, analytics dashboard

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

### v4.4 (Next - Q1 2026)
- [ ] More languages (Arabic, French, Hindi)
- [ ] Visual improvements and animations
- [ ] User onboarding tutorial
- [ ] More keyboard shortcuts
- [ ] Complete UI integration for v4.2 backend features

### v4.5 (Planned - Q2 2026)
- [ ] Firefox port (WebExtensions)
- [ ] Advanced scheduling calendar
- [ ] Webhook integration
- [ ] Performance monitoring dashboard
- [ ] Basic API for integrations

### v5.0 (Major Release - Q3 2026)

**🚀 Next major release with comprehensive feature proposals!**

See detailed planning documents:
- **[Quick Start Guide](QUICK_START_v5.0_PLANNING.md)** - Start here! 5-minute overview
- **[Feature Suggestions](FEATURE_SUGGESTIONS_v5.0.md)** - 15 detailed feature proposals
- **[Priority Matrix](FEATURE_PRIORITY_MATRIX.md)** - Prioritization analysis
- **[Roadmap](ROADMAP_v5.0.md)** - Timeline and milestones

**Top 5 Features Planned**:
1. 🤖 **AI-Powered Message Generation** - Smart compose with local models
2. 📊 **Advanced Analytics Dashboard** - Visual insights & predictive analytics
3. 📅 **Smart Scheduling & Campaigns** - Drip sequences with AI optimization
4. 👥 **Team Collaboration** - Shared workspaces & approval workflows
5. ☁️ **Cloud Sync & Backup** - Encrypted multi-device sync

**Timeline**: 13 months (4 development waves)  
**Goal**: Transform AutoChat into an intelligent communication platform

[**💬 Provide Feedback on v5.0 Plans**](https://github.com/sushiomsky/autochat/discussions)

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
