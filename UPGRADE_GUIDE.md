# AutoChat v4.0 Upgrade Guide

## What's New in v4.0?

AutoChat has been completely enhanced with advanced anti-detection features, analytics, and a beautiful new interface!

## Quick Start

### If you're upgrading from v3.0:
1. Reload the extension in `chrome://extensions/`
2. Your existing settings and phrases will be preserved
3. All new features are enabled by default

### New UI Components:

#### Stats Bar (Top)
- **Today**: Messages sent today (resets at midnight)
- **Total**: All-time message count
- **Status**: Green dot = Active, White dot = Inactive

#### New Buttons:
- **⚙️ Settings**: Open advanced settings modal
- **📊 Analytics**: View detailed statistics

## Key New Features

### 1. Typing Simulation
**What it does**: Types messages character-by-character like a real person (40-80 WPM)

**Why use it**: Makes your messages look more natural and avoids instant-text spam detection

**How to use**: Enabled by default. Disable in Settings if you want instant sending.

### 2. Anti-Repetition
**What it does**: Prevents sending the same message multiple times in a row

**Why use it**: Avoids spam patterns that could trigger detection

**How to use**: Enabled by default. Works best with 4+ messages in your list.

### 3. Template Variables
**What it does**: Dynamic content that changes with each message

**Examples**:
- `Hello! The time is {time}` → "Hello! The time is 2:30 PM"
- `Message #{random_number}` → "Message #42"
- `Today is {date} {random_emoji}` → "Today is 10/18/2025 😊"

**Available variables**:
- `{time}` - Current time
- `{date}` - Current date
- `{random_emoji}` - Random emoji
- `{random_number}` - Number 0-99
- `{timestamp}` - Unix timestamp

### 4. Active Hours
**What it does**: Only sends messages during specified hours

**Why use it**: Simulate normal human activity patterns (e.g., 9 AM - 10 PM)

**How to use**:
1. Open Settings (⚙️)
2. Enable "Active Hours Only"
3. Set start and end hours (24-hour format)

### 5. Daily Limits
**What it does**: Automatically stops after X messages per day

**Why use it**: Prevents excessive sending that could trigger rate limits

**How to use**:
1. Open Settings (⚙️)
2. Set "Daily Message Limit" (0 = unlimited)
3. Extension stops automatically when limit is reached

### 6. Variable Delays
**What it does**: Adds random 0.5-2 second "thinking time" before typing

**Why use it**: Simulates human hesitation/thought process

**How to use**: Enabled by default in Settings

### 7. Analytics Dashboard
**What it does**: Tracks your messaging activity

**How to access**: Click "📊 Analytics" button

**Features**:
- Messages sent today
- Total messages all-time
- Active status
- Reset statistics option

### 8. Import/Export Settings
**What it does**: Backup and restore all your settings

**How to use**:
1. Open Settings (⚙️)
2. Click "📥 Export" to save settings.json
3. Click "📤 Import" to restore from file

## Recommended Settings for Anti-Detection

### Conservative (Safest):
```
Send Mode: Random
Min Interval: 120 seconds (2 minutes)
Max Interval: 300 seconds (5 minutes)
Typing Simulation: ✅ Enabled
Variable Delays: ✅ Enabled
Anti-Repetition: ✅ Enabled
Template Variables: ✅ Enabled
Daily Limit: 50 messages
Active Hours: 9:00 - 22:00
```

### Moderate (Balanced):
```
Send Mode: Random
Min Interval: 60 seconds
Max Interval: 180 seconds
Typing Simulation: ✅ Enabled
Variable Delays: ✅ Enabled
Anti-Repetition: ✅ Enabled
Template Variables: ✅ Enabled
Daily Limit: 100 messages
Active Hours: 8:00 - 23:00
```

### Aggressive (Fast, Higher Risk):
```
Send Mode: Random
Min Interval: 30 seconds
Max Interval: 60 seconds
Typing Simulation: ❌ Disabled
Variable Delays: ❌ Disabled
Anti-Repetition: ✅ Enabled
Template Variables: ✅ Enabled
Daily Limit: 200 messages
Active Hours: Not set
```

## Tips for Best Results

### Message Quality:
1. Use at least 10-20 different messages
2. Add template variables for variety
3. Mix short and long messages
4. Make messages contextually appropriate

### Timing:
1. Don't set intervals too short (<30 seconds)
2. Use larger intervals during first hour of use
3. Match timing to the platform's typical activity

### Detection Avoidance:
1. Always enable typing simulation
2. Use anti-repetition with 5+ messages
3. Set reasonable daily limits
4. Configure active hours to match your timezone
5. Add template variables for uniqueness

## Troubleshooting

### Messages not sending?
1. Make sure input field is marked (green checkmark)
2. Reload the page and re-mark the field
3. Check browser console for errors (F12)

### Typing too fast/slow?
- Typing speed is randomized between 40-80 WPM
- Disable typing simulation for instant sending

### Daily limit reached?
- Check Analytics to see current count
- Reset statistics or wait until midnight
- Increase daily limit in Settings

### Settings not saving?
1. Try Export settings to backup
2. Reload extension
3. Import settings to restore

## Status Badge

The extension icon shows a badge when auto-send is active:
- **Green "ON"**: Auto-send is running
- **No badge**: Auto-send is stopped

## Legacy Files

v3.0 files are still included for compatibility:
- `content.js`
- `popup.js`
- `popup.html`

v4.0 uses:
- `content-enhanced.js`
- `popup-enhanced.js`
- `popup-enhanced.html`
- `styles.css`
- `background.js`

## Need Help?

- Check the README.md for full documentation
- View CHANGELOG.md for all changes
- Open an issue on GitHub for support

## Feedback

This is a major upgrade! If you encounter any issues or have suggestions, please:
1. Open an issue on GitHub
2. Include your Chrome version
3. Describe the problem with steps to reproduce

---

Enjoy AutoChat v4.0 Enhanced Edition! 🚀
