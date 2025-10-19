# Changelog

All notable changes to AutoChat will be documented in this file.

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
