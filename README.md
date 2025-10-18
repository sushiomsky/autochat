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

### Advanced Features (v4.0)
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

**v4.0 Enhanced Edition** - Major upgrade with:
- Typing simulation and anti-detection features
- Analytics and statistics tracking
- Advanced scheduling (active hours, daily limits)
- Template variables for dynamic content
- Retry logic and improved reliability
- Modern UI with gradient design
- Import/Export settings

**v3.0** - Complete rewrite focused on message automation

## License

MIT License - Feel free to use and modify

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

## Support

For issues or questions, please open an issue on the repository.

---
