# Changelog

All notable changes to AutoChat will be documented in this file.

## [4.5.4] - 2025-12-18 - Documentation & Release Edition

### Added
- **Documentation Reorganization**: Complete documentation structure overhaul
  - Created organized `docs/` directory with 5 categories
  - `docs/user-guides/` - End user guides and tutorials
  - `docs/features/` - Feature-specific documentation
  - `docs/development/` - Developer and contributor guides
  - `docs/releases/` - Version-specific release notes
  - `docs/archive/` - Historical documentation
  - New `docs/README.md` with complete navigation
- **Git Tag v4.5.3**: Created official release tag for current version
- **Updated ROADMAP_v5.0.md**: Comprehensive future development plan
  - 4 development waves (Foundation, Collaboration, Expansion, Polish)
  - Detailed timeline and milestones
  - Success metrics and adoption goals
- **Release Process Documentation**: Clear guidelines for future releases

### Changed
- Moved 39 documentation files from root to organized structure
- Updated all documentation links in README.md
- Updated README.md with current v4.5 completion status
- Enhanced ROADMAP_v5.0.md with realistic timelines
- Updated CHANGELOG.md with complete history

### Improved
- Better documentation discoverability
- Clear separation between user and developer docs
- Easier navigation for new contributors
- Professional documentation structure
- Cleaner repository root directory

## [4.5.3] - 2025-12-07 - v4.5 Complete Edition

### Added
- **Performance Monitoring Dashboard**: Real-time performance tracking and optimization
  - Message send statistics (total, success rate, avg duration, failures)
  - Typing speed monitoring (avg WPM, samples)
  - System resource tracking (memory usage, uptime, errors)
  - Smart recommendations based on metrics
  - Export performance data to JSON
  - Clear metrics functionality
  - Refresh on-demand updates
- **Chrome Web Store Optimization**:
  - Complete store listing guide (CHROME_STORE.md)
  - Optimized description and keywords
  - Privacy practices documentation
  - Permission justifications
  - Marketing plan and SEO strategy
  - Publishing checklist

### Changed
- Updated version to 4.5.3
- Updated popup version display to "v4.5 Integration Foundation"
- Enhanced UI with performance monitor button

### Technical
- Performance monitor module (`src/performance.js`)
- Performance modal with real-time stats
- Metrics stored in chrome.storage
- Automatic memory usage tracking (when available)
- Performance recommendations engine

### v4.5 Roadmap - ✅ COMPLETE
- ✅ Firefox port (v4.5.2)
- ✅ Webhook integration (v4.5.0)
- ✅ Human-like behavior (v4.5.1)
- ✅ Performance monitoring (v4.5.3)
- ✅ Chrome Web Store optimization (v4.5.3)

## [4.5.2] - 2025-12-07 - Firefox Support

### Added
- **Firefox Browser Support**: Full cross-browser compatibility
  - Firefox Manifest V2 support
  - `manifest_firefox.json` for Firefox-specific configuration
  - Browser API compatibility layer
  - Separate Firefox build pipeline (`npm run build:firefox`)
  - Firefox package script (`npm run package:firefox`)
  - Comprehensive Firefox documentation (FIREFOX.md)
- **Build System Enhancements**:
  - `scripts/build-firefox.js` - Firefox-specific build script
  - Automatic `chrome.*` to `browser.*` API conversion
  - Firefox-compatible manifest generation
  - Separate `dist-firefox` output directory

### Changed
- Updated package.json with Firefox build commands
- Build system now supports both Chrome and Firefox targets
- Updated .gitignore to exclude `dist-firefox` directory

### Technical
- Firefox uses Manifest V2 (browser_action instead of action)
- Background scripts instead of service workers for Firefox
- Promise-based browser API namespace
- Full feature parity with Chrome version

### Documentation
- Added FIREFOX.md with installation and development guide
- Firefox-specific troubleshooting section
- Browser compatibility notes
- Migration guide from Chrome to Firefox

## [4.5.1] - 2025-12-07 - Human-Like Improvements & Donations

### Added
- **Human-Like Message Imperfections**: Automatic introduction of natural human typing errors (10% of messages)
  - Random typos (adjacent letter swaps)
  - Missing punctuation
  - Double spaces
  - Lowercase sentence starts
  - Extra letters
  - Makes bot behavior less detectable in Turing tests
- **Crypto Donation Feature**: Support development with cryptocurrency donations
  - Bitcoin (BTC), Ethereum (ETH), USDT (TRC20), Litecoin (LTC)
  - One-click copy addresses
  - Beautiful donation modal with copy feedback
  - Donation button in header (💝)
- **Natural Language Phrases**: Replaced farming-specific phrases with generic, commonly-used expressions
  - English: 200+ common phrases (Hi, Hello, Thanks, etc.)
  - Spanish: 150+ natural phrases (Hola, Gracias, etc.)
  - Urdu: 150+ everyday phrases
  - Reduces detectability when using default phrases

### Changed
- Completely replaced all farming_phrases files with natural, everyday language
- Messages now include occasional human-like imperfections for better Turing test performance
- "Say as less as possible, much as needed" strategy implemented
- Donation modal accessible from main interface

### Technical
- Added `addHumanImperfections()` function in content-enhanced.js
- Applied to both scheduled messages and mention replies
- Donation modal with clipboard API integration
- Copy feedback with visual confirmation

## [4.5.0] - 2025-12-07 - Integration Foundation

### Added
- **Webhook Integration System**: Complete webhook infrastructure for external integrations
  - 8 event types: message_sent, campaign_started, campaign_stopped, campaign_paused, campaign_resumed, daily_limit_reached, error, milestone
  - Webhook management UI with full CRUD operations
  - Custom HTTP methods (POST, GET, PUT, PATCH)
  - Custom headers support for authentication
  - Automatic retry logic (3 attempts with exponential backoff)
  - Statistics tracking (triggers, failures, last triggered)
  - Test functionality for webhooks
  - Enable/disable controls (global and per-webhook)
- **Webhook Module** (`src/webhooks.js`): Core webhook functionality with 33 comprehensive tests
- **Webhook Manager Modal**: Full-featured UI for webhook configuration
  - Add, edit, delete webhooks
  - View webhook statistics and performance
  - Test webhooks with real payloads
  - Enable/disable webhooks individually
- **Background Script Integration**: Automatic webhook triggers for all events
- **Content Script Integration**: Message-level webhook triggers with context data
- **Documentation**: 
  - Complete webhook guide (WEBHOOK_GUIDE.md)
  - Integration examples for popular services (WEBHOOK_EXAMPLES.md)
  - Templates for Slack, Discord, Teams, Telegram, and more

### Changed
- Updated version to 4.5.0
- Enhanced background script with webhook trigger functionality
- Enhanced content script to include webhook context in messages
- Improved CSS with webhook-specific styling (modal-large, webhook-list, etc.)

### Technical
- Added 33 new tests for webhook functionality (total: 158 tests)
- All tests passing with zero errors/warnings
- Build system includes webhook module in dist
- Linting passes with zero errors/warnings
- Webhook system uses Promise-based API for compatibility
- Retry logic implements exponential backoff (1s, 2s, 3s)
- Request timeout set to 10 seconds
- Maximum 10 webhooks per extension

### Files Added
- `src/webhooks.js` - Core webhook management module
- `tests/unit/webhooks.test.js` - Comprehensive webhook tests
- `WEBHOOK_GUIDE.md` - Complete webhook documentation
- `WEBHOOK_EXAMPLES.md` - Integration examples and templates

### Files Modified
- `popup-enhanced.html` - Added webhook management modal and settings
- `popup-enhanced.js` - Integrated webhook manager UI
- `styles.css` - Added webhook-specific styles
- `background.js` - Added webhook trigger functionality
- `content-enhanced.js` - Added webhook context for messages
- `manifest.json` - Updated version to 4.5.0
- `package.json` - Updated version to 4.5.0

## [4.4.0] - 2025-11-28 - UI Polish Edition

### Added
- **Notification Center**: In-app notification history panel with full CRUD operations
  - View all notifications with icons based on type
  - Mark notifications as read (individual or all)
  - Delete notifications (individual or all)
  - Unread count badge in header
  - Time ago display for notifications
- **Category Manager**: Full category management interface
  - Create new categories with custom name, icon, and color
  - Edit existing categories
  - Delete categories
  - Category statistics display
- **Help Modal**: Comprehensive in-app help documentation
  - Getting started guide
  - Template variables reference
  - Keyboard shortcuts reference
  - Advanced features explanation
- **Enhanced Header**: Added notification bell with unread badge
- **Improved UI**: Better button layout and organization

### Changed
- Updated version to 4.4.0
- Reorganized category display code to avoid conflicts
- Enhanced notification module with history tracking
- Improved button layout in control section

### Technical
- Added 10 new tests for notification history functionality (119 total tests)
- Updated `src/notifications.js` with history management
- Added new UI elements and styles for notification center and category manager
- Added `header-actions` container for better header organization

### Files Modified
- `popup-enhanced.html` - Added notification center, category manager, and help modals
- `popup-enhanced.js` - Added notification center and category manager logic
- `styles.css` - Added styles for new UI components
- `src/notifications.js` - Added history management functionality
- `tests/unit/notifications.test.js` - Added 10 new tests for history functionality
- `manifest.json` - Updated version to 4.4.0
- `package.json` - Updated version to 4.4.0

## [4.3.0] - 2025-11-22 - Multi-Language Phrases Edition

### Added
- **Multi-Language Farming Phrases**: Language-specific phrase libraries for enhanced user experience
  - English (en): 671+ original phrases
  - Urdu (ur): 300+ culturally adapted phrases
  - Spanish (es): 300+ Spanish translations
- **Smart Phrase Loading**: Automatically loads phrases based on user's selected language
- **Language Fallback**: Falls back to English if language-specific file not found
- **Language Detection**: Detects browser locale and region codes (e.g., en-US -> en)
- **Comprehensive Tests**: 5 new test cases for language-specific phrase loading
- **Documentation**: New MULTI_LANGUAGE_PHRASES.md guide for adding languages

### Changed
- Updated `loadDefaultPhrasesFromFile()` to support dynamic language loading
- Enhanced build script to copy language-specific phrase files and locales directory
- Updated manifest.json to include all phrase files as web_accessible_resources
- Added Spanish option to language selector in popup UI
- Improved i18n.js to support Spanish language

### Technical
- Created `farming_phrases_en.txt`, `farming_phrases_ur.txt`, `farming_phrases_es.txt`
- Added `_locales/es/messages.json` with full Spanish translations
- Updated test setup to mock chrome.i18n API
- Enhanced build script with recursive directory copying for _locales and src
- All 82 tests passing with new language-specific tests

### Files Added
- `farming_phrases_en.txt` - English phrases (671 lines)
- `farming_phrases_ur.txt` - Urdu phrases (300 lines)
- `farming_phrases_es.txt` - Spanish phrases (300 lines)
- `_locales/es/messages.json` - Spanish UI translations
- `tests/unit/language-phrases.test.js` - Language loading tests
- `MULTI_LANGUAGE_PHRASES.md` - Multi-language documentation

## [4.1.0] - 2025-10-19 - Professional Edition

### Added
- **Dark Mode**: Toggle between light and dark themes with smooth transitions
- **Keyboard Shortcuts**: Ctrl+S (start), Ctrl+X (stop), Ctrl+P (pause), Escape (close modals)
- **Pause/Resume**: Temporarily halt auto-send without stopping completely
- **Analytics Export**: Export all data and settings as JSON backup
- **Build System**: Professional npm-based build pipeline with scripts
- **Testing Suite**: Jest-based tests with >80% coverage goal
- **CI/CD Pipeline**: GitHub Actions for automated testing and releases
- **Security Enhancements**: Input validation, XSS protection, rate limiting
- **Performance Optimizations**: Debounced auto-save, lazy loading
- **Accessibility**: ARIA labels, focus management, keyboard navigation
- **Developer Tools**: ESLint, Prettier, EditorConfig
- **Documentation**: CONTRIBUTING.md, RELEASE_NOTES, SCREENSHOTS guide

### Changed
- Auto-save now debounced (1 second delay) for better performance
- Improved theme persistence across sessions
- Enhanced modal scrolling and rendering
- Better error messages and user feedback
- Optimized phrase list rendering

### Technical
- Added `package.json` with comprehensive dev dependencies
- Created `src/` directory for utility modules
- Added `tests/` directory with unit and integration tests
- Created `scripts/` for build automation
- Added `.github/workflows/` for CI/CD
- Implemented debounce utility for performance
- Added security validation utilities
- Created rate limiter class

### Developer Experience
- New commands: `npm run build`, `npm test`, `npm run lint`
- Watch mode: `npm run watch` for auto-rebuild
- Package command: `npm run package` for distribution
- Format command: `npm run format` for code styling
- Test coverage: `npm run test:coverage`

## [4.0.0] - 2025-10-18 - Enhanced Edition

### Added
- **Typing Simulation**: Realistic character-by-character typing with variable WPM (40-80)
- **Anti-Detection Features**:
  - Variable delays (0.5-2s thinking time)
  - Anti-repetition algorithm to avoid repeated messages
  - Human-like behavior patterns
- **Analytics Dashboard**:
  - Messages sent today counter
  - Total messages counter (all-time)
  - Auto-send status indicator
  - Statistics reset functionality
- **Advanced Scheduling**:
  - Active hours (only send during specified times)
  - Daily message limits with automatic stop
- **Template Variables**:
  - `{time}` - Current time
  - `{date}` - Current date
  - `{random_emoji}` - Random emoji
  - `{random_number}` - Random number 0-99
  - `{timestamp}` - Unix timestamp
- **Settings Management**:
  - Import settings from JSON file
  - Export settings to JSON file
  - Advanced settings modal
- **UI Improvements**:
  - Modern gradient design
  - Animated notifications
  - Stats bar at top of popup
  - Modal dialogs for settings and analytics
  - Improved button layout
  - Custom CSS styling
- **Reliability Features**:
  - Retry logic (up to 3 attempts)
  - Better error handling
  - Field re-detection on failure
  - Status badge on extension icon
- **Background Service Worker**:
  - Badge management
  - Statistics tracking
  - Daily counter reset at midnight

### Changed
- Upgraded UI from basic to modern gradient design
- Improved file structure (content-enhanced.js, popup-enhanced.js)
- Better code organization and documentation
- Enhanced message sending with typing simulation option
- Improved input field detection and validation

### Technical
- Added `background.js` service worker
- Created `styles.css` for modern styling
- Implemented template variable processing
- Added anti-repetition tracking with recent messages array
- Improved storage management with import/export
- Better async/await handling throughout

## [3.0.0] - 2025-10-17

### Added
- Complete rewrite of extension
- Random and sequential send modes
- Customizable time intervals
- Phrase management system
- Custom and default phrase library
- Auto-save functionality
- Universal website compatibility

### Changed
- Migrated to Manifest V3
- Improved content script injection
- Better UI/UX design
- Enhanced message list management

## [2.0.0] - Previous Version

### Added
- Basic automation features
- Simple popup interface
- Message rotation

## [1.0.0] - Initial Release

### Added
- Basic message sending
- Simple field marking
- Manual controls
