# Chat Logging Feature Documentation

## Overview

The Chat Logging feature captures and stores all chat messages for later review, search, and analysis. This is useful for:
- Keeping a record of conversations
- Searching through past messages
- Analyzing chat patterns
- Reviewing bot performance
- Compliance and record-keeping

## Features

### Message Capture
- **Automatic Detection**: Captures all messages in the marked message container
- **Bidirectional**: Records both incoming and outgoing messages
- **Metadata**: Stores sender, timestamp, direction, and platform information
- **Efficient Storage**: Uses chrome.storage.local with automatic rotation

### Chat Log Viewer
- **Search**: Full-text search across all messages
- **Filters**: Filter by date range, sender, direction (incoming/outgoing), and platform
- **Statistics**: View total messages, incoming/outgoing counts, and platforms
- **Pagination**: Handles large logs with 50 messages per page
- **Export**: Export logs to JSON, CSV, or TXT formats

### Storage Management
- **Automatic Cleanup**: Keeps only the most recent 10,000 messages
- **Size Limits**: Enforces 5MB storage limit with automatic rotation
- **Efficient Queuing**: Batches messages for optimal performance

## Usage

### Enabling Chat Logging

1. **Mark Message Container** (required first):
   - Click "📌 Mark Message Container" button in the popup
   - Click on the chat message container on the page
   - Confirm the container is marked

2. **Enable Logging**:
   - Open Settings (⚙️ button)
   - Find "📝 Chat Logging" section
   - Check "💾 Enable Chat Logging"
   - Logging starts immediately

### Viewing Chat Logs

**From Popup**:
- Click "📖 Chat Logs" button in main view
- Or open Settings and click "📖 View Chat Logs"

**From Browser**:
- Navigate to `chrome-extension://<extension-id>/chat-log-viewer.html`

### Searching Messages

1. **Text Search**:
   - Enter search terms in the search box
   - Searches both message text and sender names
   - Case-insensitive matching

2. **Filter by Direction**:
   - All: Show all messages
   - Incoming: Only messages from others
   - Outgoing: Only your messages

3. **Filter by Platform**:
   - Automatically detects chat platform
   - Filter by WhatsApp, Discord, Telegram, etc.

4. **Filter by Date**:
   - Set "From" date for earliest messages
   - Set "To" date for latest messages
   - Leave blank for all dates

5. **Clear Filters**:
   - Click "Clear Filters" to reset all filters

### Exporting Logs

1. Click "📥 Export" button
2. Choose format:
   - **JSON**: Full data with metadata
   - **CSV**: Spreadsheet-compatible format
   - **TXT**: Plain text, human-readable

3. File downloads automatically

**Export Formats**:

**JSON**:
```json
{
  "exportDate": "2025-12-18T05:43:29.096Z",
  "messageCount": 150,
  "messages": [
    {
      "id": "msg_12345",
      "text": "Hello!",
      "sender": "User1",
      "timestamp": "2025-12-18T05:40:00.000Z",
      "direction": "incoming",
      "platform": "WhatsApp",
      "url": "https://web.whatsapp.com/"
    }
  ]
}
```

**CSV**:
```csv
Timestamp,Sender,Direction,Platform,Message
2025-12-18T05:40:00.000Z,User1,incoming,WhatsApp,"Hello!"
```

**TXT**:
```
[12/18/2025, 5:40:00 AM] User1 (incoming): Hello!
```

### Clearing Logs

1. Click "🗑️ Clear Logs" button
2. Confirm deletion (cannot be undone)
3. All logs are permanently deleted

## Technical Details

### Message Detection

The logger uses `MutationObserver` to detect new messages:
- Watches for DOM changes in the message container
- Extracts message text, sender, and metadata
- Identifies message direction (incoming/outgoing)
- Batches messages for efficient storage

### Storage Structure

**Storage Key**: `chatLogs`

**Message Format**:
```javascript
{
  id: "msg_<hash>_<timestamp>",
  text: "Message text (max 1000 chars)",
  sender: "Sender name (max 100 chars)",
  timestamp: "ISO 8601 timestamp",
  direction: "incoming|outgoing|unknown",
  url: "Page URL",
  platform: "Platform name"
}
```

### Platform Detection

Supported platforms:
- WhatsApp Web
- Discord
- Telegram Web
- Facebook Messenger
- Slack
- Microsoft Teams
- Unknown (for other sites)

Detection uses hostname matching for security.

### Performance

- **Batching**: Messages queued and saved every 5 seconds
- **Deduplication**: Prevents duplicate messages
- **Efficient Queries**: Indexed by timestamp for fast filtering
- **Pagination**: Only loads 50 messages at a time in viewer

### Storage Limits

- **Maximum Messages**: 10,000 messages
- **Maximum Size**: 5MB (enforced by Chrome)
- **Rotation**: Oldest 20% deleted when limit reached
- **Per-message Limit**: 1000 characters

## Security & Privacy

### Data Storage

- **Local Only**: All data stored in chrome.storage.local
- **No Cloud**: Messages never sent to external servers
- **No Analytics**: No tracking or analytics on logs
- **User Control**: Complete control over data (export/delete)

### URL Sanitization

- Platform detection uses hostname matching only
- Prevents URL injection attacks
- Validated against CodeQL security rules

## Troubleshooting

### Messages Not Captured

1. **Check Message Container**: Ensure it's marked correctly
2. **Check Enabled**: Verify logging is enabled in settings
3. **Reload Page**: Try reloading after marking container
4. **Check Platform**: Some platforms may use unusual structures

### Storage Full

1. **Export Logs**: Save important logs before clearing
2. **Clear Old Logs**: Use "Clear Logs" to free space
3. **Reduce Limit**: Extension automatically manages rotation

### Search Not Working

1. **Check Filters**: Clear all filters and try again
2. **Case Sensitive**: Search is case-insensitive
3. **Partial Match**: Searches for partial text matches

## Best Practices

1. **Regular Exports**: Export logs periodically for backup
2. **Storage Management**: Clear old logs when not needed
3. **Privacy**: Be aware logs contain all messages
4. **Performance**: Disable logging on low-resource devices

## API Reference

### Content Script Messages

**Start Logging**:
```javascript
chrome.tabs.sendMessage(tabId, {
  action: 'startChatLogging'
});
```

**Stop Logging**:
```javascript
chrome.tabs.sendMessage(tabId, {
  action: 'stopChatLogging'
});
```

**Get Status**:
```javascript
chrome.tabs.sendMessage(tabId, {
  action: 'getChatLogStatus'
}, (response) => {
  console.log(response.enabled, response.isLogging);
});
```

### Storage Access

**Read Logs**:
```javascript
chrome.storage.local.get(['chatLogs'], (data) => {
  const logs = data.chatLogs || [];
  console.log(logs);
});
```

**Clear Logs**:
```javascript
chrome.storage.local.set({ chatLogs: [] });
```

## Future Enhancements

Planned features:
- [ ] Advanced search with regex support
- [ ] Message tagging and categories
- [ ] Conversation threading
- [ ] Sentiment analysis
- [ ] Export to PDF
- [ ] Cloud backup (optional)
- [ ] Encrypted storage

## Related Features

- **Manual Detection**: Detects when you manually send messages
- **Mention Detection**: Auto-reply to mentions
- **Analytics**: Track messaging statistics
