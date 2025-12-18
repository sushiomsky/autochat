# Mention Detection Feature

## Overview

The Mention Detection feature automatically monitors chat messages and sends an auto-reply when someone mentions you or uses specific keywords. This feature is useful for:

- Responding quickly when tagged in group chats
- Acknowledging mentions while you're away
- Maintaining engagement in active conversations
- Custom keyword-based auto-responses

## How It Works

1. **Monitor Messages**: Watches for new messages in the marked message container
2. **Detect Mentions**: Checks if messages contain your keywords (e.g., @username, your name)
3. **Auto-Reply**: Automatically sends a reply from your configured list of responses
4. **Anti-Duplicate**: Tracks processed messages to avoid replying multiple times to the same message

## Setup Instructions

### Step 1: Mark Message Container

Before using mention detection, you must mark the message container:

1. Open the AutoChat popup
2. Click "📌 Mark Message Container"
3. Click on the area where chat messages appear
4. You should see a confirmation that the container is marked

### Step 2: Configure Mention Detection

1. Open AutoChat popup
2. Click "⚙️ Settings" button
3. Scroll down to "🎯 Mention Detection" section
4. Check the "👤 Auto-Reply to Mentions" checkbox

### Step 3: Add Keywords

In the "Keywords to Watch" textarea, enter keywords that should trigger a reply (one per line):

```
@username
your name
hey you
```

**Tip**: Keywords are case-insensitive. Both "@Username" and "@username" will be detected.

### Step 4: Add Reply Messages

In the "Reply Messages" textarea, enter responses to send when mentioned (one per line):

```
Thanks for mentioning me!
Hello! I'm here.
Hi! What's up?
```

**Tip**: A random message will be selected from your list each time you're mentioned.

### Step 5: Activate

Once configured, the feature will automatically start monitoring for mentions. You'll see messages in the browser console when mentions are detected.

## Features

### Smart Detection

- **@mention format**: Detects `@username` style mentions
- **Plain keywords**: Detects keywords without @ symbol
- **Case insensitive**: Works regardless of capitalization
- **Partial matches**: "username" matches "Hey username!"

### Natural Behavior

- **Random delay**: Waits 1-3 seconds before replying (appears more natural)
- **Random replies**: Picks a different reply message each time
- **Template variables**: Supports `{time}`, `{date}`, `{random_emoji}`, etc. in reply messages
- **Anti-duplicate**: Tracks last 100 messages to avoid duplicate replies

### Safety Features

- **Duplicate prevention**: Won't reply twice to the same message
- **Message container required**: Won't activate without a marked container
- **Validation**: Requires at least one keyword and one reply message
- **Manual control**: Can be enabled/disabled anytime

## Configuration Options

### Keywords

- **Format**: One keyword per line
- **Examples**:
  - `@john`
  - `john doe`
  - `hey john`
  - `username`
- **Wildcards**: Not supported (use specific keywords)
- **Limit**: No limit, but keep it reasonable (5-10 keywords)

### Reply Messages

- **Format**: One message per line
- **Template variables**: Supported
  - `{time}` - Current time (e.g., "2:30 PM")
  - `{date}` - Current date (e.g., "11/22/2025")
  - `{random_emoji}` - Random emoji
  - `{random_number}` - Random number 0-99
- **Examples**:
  ```
  Thanks! Got your message at {time}
  Hi! I'll get back to you soon {random_emoji}
  Received on {date}
  ```

## Usage Scenarios

### Scenario 1: Team Chat Monitoring

**Setup**:

- Keywords: `@yourname`, `your actual name`
- Replies: `Got it! I'll respond soon.`, `Thanks for the ping!`, `Acknowledged {time}`

**Result**: Team members get immediate acknowledgment when they mention you.

### Scenario 2: Customer Support

**Setup**:

- Keywords: `support`, `help`, `@support`
- Replies: `Thanks for reaching out! A team member will assist you shortly.`, `We've received your request {time}`

**Result**: Customers get instant acknowledgment while waiting for human response.

### Scenario 3: Group Chat Engagement

**Setup**:

- Keywords: `@everyone`, `team`
- Replies: `Noted!`, `I'm here {random_emoji}`, `Copy that`

**Result**: Stay engaged in group discussions even when partially away.

## Troubleshooting

### Mention detection not working

**Possible causes**:

1. Message container not marked
   - **Solution**: Click "📌 Mark Message Container" and select the chat area
2. Keywords not configured
   - **Solution**: Add at least one keyword in settings
3. Reply messages not configured
   - **Solution**: Add at least one reply message in settings
4. Feature disabled
   - **Solution**: Check the "Auto-Reply to Mentions" checkbox in settings

### Replying to wrong messages

**Possible cause**: Keywords too generic

- **Solution**: Use more specific keywords like `@username` instead of common words

### Not replying fast enough

**Current behavior**: 1-3 second delay is intentional for natural appearance

- **Note**: Cannot be configured (hard-coded for anti-detection)

### Duplicate replies

**Possible cause**: Message container changed or page reloaded

- **Solution**: The feature tracks last 100 messages. If you reload the page, the history resets. This is expected behavior.

## Technical Details

### Architecture

```
┌─────────────────────────────────────────────┐
│           Mention Detection Flow             │
├─────────────────────────────────────────────┤
│                                             │
│  1. MutationObserver watches container      │
│     └─> Detects new message nodes          │
│                                             │
│  2. For each new message:                   │
│     └─> Extract text content               │
│     └─> Generate unique message ID         │
│     └─> Check if already processed         │
│                                             │
│  3. Check for keyword match:                │
│     └─> Case-insensitive comparison        │
│     └─> Supports @mention and plain text   │
│                                             │
│  4. If mention detected:                    │
│     └─> Mark message as processed          │
│     └─> Wait random delay (1-3 seconds)    │
│     └─> Select random reply message        │
│     └─> Process template variables         │
│     └─> Send message via sendMessage()     │
│                                             │
└─────────────────────────────────────────────┘
```

### Message Tracking

- Uses a `Set` to store unique message IDs
- Message ID = `${textContent}-${timestamp}` (max 100 chars)
- Automatically cleans up old entries when exceeding 100 messages
- Prevents duplicate replies to the same message

### Performance

- **Low overhead**: Only processes new messages (MutationObserver)
- **Efficient storage**: Set-based lookup is O(1)
- **Memory limited**: Caps at 100 processed messages
- **No polling**: Event-driven, not CPU-intensive

## Privacy & Security

### Data Storage

- **Local only**: All data stored in browser's local storage
- **No server**: No data sent to external servers
- **User controlled**: Can be disabled/cleared anytime

### Permissions

- Uses existing AutoChat permissions
- No additional permissions required
- Requires same permissions as regular message sending

### Best Practices

1. **Use specific keywords**: Avoid overly generic terms
2. **Professional replies**: Keep responses appropriate for your context
3. **Respect platforms**: Some platforms may have rules against automation
4. **Monitor behavior**: Check console logs to verify proper operation
5. **Disable when unnecessary**: Turn off when not needed

## Compatibility

- **Platforms**: Works on any website where AutoChat works
- **Browsers**: Chrome, Edge, Brave (Chromium-based)
- **Requirements**:
  - Message container must be marked
  - Chat input field must be marked
  - Page must not heavily modify DOM structure

## API Reference

### Storage Keys

```javascript
{
  mentionDetectionEnabled: boolean,    // Feature on/off
  mentionKeywords: string[],          // Array of keywords
  mentionReplyMessages: string[]      // Array of reply messages
}
```

### Content Script Messages

```javascript
// Start monitoring
chrome.tabs.sendMessage(tabId, {
  action: 'startMentionDetection',
  keywords: ['@username', 'john'],
  replyMessages: ['Thanks!', 'Hi!'],
});

// Stop monitoring
chrome.tabs.sendMessage(tabId, {
  action: 'stopMentionDetection',
});

// Get status
chrome.tabs.sendMessage(tabId, {
  action: 'getMentionStatus',
});
// Returns: { enabled: boolean, keywords: string[], replyMessages: string[] }
```

## Future Enhancements

Potential improvements for future versions:

- [ ] Customizable reply delay
- [ ] Regex pattern support for keywords
- [ ] Conditional replies based on keyword matched
- [ ] Reply statistics (how many mentions detected/replied)
- [ ] Mention notification sound
- [ ] Keyword groups with specific replies
- [ ] Machine learning for context-aware replies
- [ ] Integration with AI for intelligent responses

## Changelog

### v4.3.0 (2025-11-22)

- ✨ Initial release of mention detection feature
- ✅ Support for @mention and plain keyword detection
- ✅ Random reply selection
- ✅ Template variable support in replies
- ✅ Anti-duplicate message tracking
- ✅ Natural delay before replying (1-3 seconds)
- ✅ UI integration in settings panel
- ✅ Comprehensive test coverage (13 tests)

## Support

For issues or questions about mention detection:

1. Check this documentation first
2. Review browser console for error messages
3. Verify message container is properly marked
4. Open an issue on [GitHub](https://github.com/sushiomsky/autochat/issues)

## License

This feature is part of AutoChat and is licensed under the MIT License.

---

**Note**: Use this feature responsibly. Automated responses should not violate platform terms of service or spam other users. Always ensure your automation is appropriate for your use case.
