# AutoChat - Automated Message Sender

A Chrome extension that automatically sends messages to chat applications with customizable timing and message rotation.

## Features

- 🎯 **Easy Setup**: Click to mark any text input field on any website
- 📝 **Multiple Messages**: Enter a list of messages to rotate through
- 🔀 **Two Send Modes**:
  - **Random**: Randomly selects messages from your list
  - **Sequential**: Sends messages in order, then loops back
- ⏱️ **Smart Timing**: Set min/max intervals with random timing between sends
- 💾 **Auto-Save**: All settings automatically persist between sessions
- 🌐 **Universal**: Works on any chat website (Discord, WhatsApp Web, Telegram, etc.)

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
- Uses CSS selector-based input field detection
- Supports standard inputs, textareas, and contenteditable elements
- Attempts multiple send methods (Enter key + button click detection)

## Permissions

- `scripting`: To inject content script for automation
- `activeTab`: To interact with the current page
- `storage`: To save settings
- `host_permissions`: To work on all websites

## Files

- `manifest.json`: Extension configuration
- `content.js`: Core automation logic
- `popup.html`: Extension popup interface
- `popup.js`: Popup UI controller

## Version

**v3.0** - Complete rewrite focused on message automation

## License

MIT License - Feel free to use and modify

## Notes

⚠️ **Important**: Use this extension responsibly. Automated messaging may violate terms of service on some platforms. This tool is intended for personal use, testing, and controlled environments only.

## Support

For issues or questions, please open an issue on the repository.

---

Generated with [Continue](https://continue.dev)

Co-Authored-By: Continue <noreply@continue.dev>
