# Changelog

All notable changes to AutoChat will be documented in this file.

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
