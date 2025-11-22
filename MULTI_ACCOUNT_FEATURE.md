# Multi-Account Support Feature

## Overview

The Multi-Account Support feature allows you to manage multiple account profiles within AutoChat. Each profile stores separate settings, making it easy to switch between different automation scenarios without reconfiguring everything.

This feature is especially useful for:
- **Casino rain farmers** managing multiple casino accounts
- Users with work and personal automation needs
- Different chat platforms requiring different configurations
- Testing different automation strategies

## Key Features

✅ **Multiple Profiles**: Create unlimited account profiles  
✅ **Quick Switching**: Switch between accounts with one click  
✅ **Isolated Settings**: Each profile has completely separate settings  
✅ **Import/Export**: Backup and share individual profiles  
✅ **Protected Default**: Default account cannot be deleted  
✅ **Safe Deletion**: Cannot delete currently active account  

## How It Works

### Account Profiles

Each account profile stores:
- **Messages**: Custom message list
- **Keywords**: Mention detection keywords
- **Reply Messages**: Auto-reply messages
- **Intervals**: Min/Max send intervals
- **Features**: All checkbox settings (typing simulation, anti-repetition, etc.)
- **Active Hours**: Schedule configuration
- **Daily Limits**: Message sending limits

### Storage

- Profiles are stored locally in browser storage
- No cloud sync (privacy-first design)
- Each profile is completely independent
- Settings are preserved when switching accounts

## Setup Instructions

### Step 1: Access Account Management

1. Open AutoChat popup
2. Look for the "👤 Account Profile" selector at the top
3. Click the ⚙️ button next to the dropdown

### Step 2: Create New Profile

1. In the "Manage Account Profiles" modal
2. Enter a name (e.g., "Casino Account 1", "Rain Farmer")
3. Click "➕ Create Profile"
4. Your new profile is created (empty settings)

### Step 3: Configure Profile

1. Switch to your new profile using the dropdown
2. Configure all settings for this account:
   - Mark input field and message container
   - Add messages/keywords
   - Set intervals and features
   - Configure mention detection
3. Settings auto-save to the active profile

### Step 4: Switch Between Profiles

Method 1: Use the dropdown in the main popup
Method 2: Use the account management modal

When you switch:
- Current account settings are saved
- New account settings are loaded
- All UI updates to reflect new account

## Usage Scenarios

### Scenario 1: Multiple Casino Accounts

**Setup**:
- Profile 1: "Stake Rain Farmer"
  - Keywords: rain, drop, giveaway, @myusername1
  - Replies: Thanks!, ty, 🎉, claim
  - Intervals: 1-2 minutes
- Profile 2: "BC.Game Rain Farmer"
  - Keywords: rain, bonus, @myusername2
  - Replies: ty!, thx, appreciated
  - Intervals: 1-3 minutes

**Usage**: Switch profiles based on which casino you're using

### Scenario 2: Work vs Personal

**Setup**:
- Profile 1: "Work Slack"
  - Messages: Professional responses
  - Keywords: @firstname.lastname, urgent
  - Intervals: 5-10 minutes (appear thoughtful)
- Profile 2: "Gaming Discord"
  - Messages: Casual chat
  - Keywords: @nickname, hey
  - Intervals: 1-2 minutes (stay active)

**Usage**: Switch based on context

### Scenario 3: Testing vs Production

**Setup**:
- Profile 1: "Testing"
  - Short intervals for quick testing
  - Test messages
  - Mention detection enabled for debugging
- Profile 2: "Production"
  - Real intervals
  - Real messages
  - Production configuration

**Usage**: Test changes in "Testing" profile before switching to "Production"

## Account Management

### Creating Accounts

**Requirements**:
- Name: 1-50 characters
- Name: Cannot be empty or whitespace only
- Name: Should be descriptive (e.g., "Casino Account 1" not "Account 1")

**Best Practices**:
- Use descriptive names
- Include platform name (e.g., "Stake - Rain Farmer")
- Use numbering if you have many (e.g., "Casino 1", "Casino 2")

### Switching Accounts

**What Happens**:
1. Current account settings are saved automatically
2. Content script is notified (if mention detection is active)
3. New account settings are loaded from storage
4. UI updates to show new account settings
5. Notification confirms the switch

**Switch Methods**:
- **Dropdown**: Quick switch from main popup
- **Manage Modal**: Switch while viewing all accounts

**Safety**:
- All settings are automatically saved before switching
- No data is lost when switching
- Previous account remains unchanged

### Exporting Accounts

**Purpose**:
- Backup account configuration
- Share configuration with others
- Transfer between browsers/devices

**Export Process**:
1. Open Account Management modal
2. Find the account to export
3. Click "📥 Export" button
4. JSON file downloads automatically

**Export File Contains**:
- Account name
- All settings (messages, keywords, intervals, etc.)
- Export timestamp
- Version information

**File Format**:
```json
{
  "name": "Casino Account 1",
  "settings": {
    "messageList": "Thanks!\nty",
    "mentionKeywords": ["rain", "drop"],
    "mentionReplyMessages": ["Thanks!", "ty"],
    "minInterval": "1",
    "maxInterval": "2",
    "mentionDetectionEnabled": true
  },
  "exportDate": "2025-11-22T21:30:00.000Z"
}
```

### Deleting Accounts

**Restrictions**:
- ❌ Cannot delete "Default Account" (protected)
- ❌ Cannot delete currently active account (switch first)
- ✅ Can delete any other account

**Deletion Process**:
1. Ensure account is not active (switch to another if needed)
2. Open Account Management modal
3. Click 🗑️ button on the account
4. Confirm deletion (cannot be undone)

**Safety Notes**:
- Deletion is permanent (no undo)
- Export account before deleting if you might need it later
- Deleted account cannot be recovered

## UI Components

### Main Popup - Account Selector

```
┌──────────────────────────────────────┐
│ 👤 Account Profile:                  │
│ ┌──────────────────────────┬───────┐ │
│ │ Default Account     ▼    │  ⚙️   │ │
│ └──────────────────────────┴───────┘ │
└──────────────────────────────────────┘
```

- **Dropdown**: Shows all accounts, switch by selecting
- **⚙️ Button**: Opens account management modal

### Account Management Modal

```
┌────────────────────────────────────────────────┐
│ 👥 Manage Account Profiles                [×] │
├────────────────────────────────────────────────┤
│ Create New Profile:                            │
│ ┌──────────────────────────────────────────┐  │
│ │ e.g., Casino Account 1                   │  │
│ └──────────────────────────────────────────┘  │
│ [➕ Create Profile]                            │
│                                                │
│ ────────────────────────────────────────────  │
│                                                │
│ Saved Profiles:                                │
│                                                │
│ ┌────────────────────────────────────────────┐│
│ │ Default Account              [ACTIVE]      ││
│ │                    [📥 Export]             ││
│ └────────────────────────────────────────────┘│
│                                                │
│ ┌────────────────────────────────────────────┐│
│ │ Casino Account 1                           ││
│ │         [🔄 Switch] [📥 Export] [🗑️]       ││
│ └────────────────────────────────────────────┘│
│                                                │
│ ┌────────────────────────────────────────────┐│
│ │ Rain Farmer Profile                        ││
│ │         [🔄 Switch] [📥 Export] [🗑️]       ││
│ └────────────────────────────────────────────┘│
│                                                │
│ Each profile stores separate settings          │
│                                                │
│ [Close]                                        │
└────────────────────────────────────────────────┘
```

## Technical Details

### Storage Structure

```javascript
{
  currentAccount: 'account_1234567890',
  accounts: {
    default: {
      name: 'Default Account',
      settings: { /* all settings */ }
    },
    account_1234567890: {
      name: 'Casino Account 1',
      settings: { /* all settings */ }
    }
  }
}
```

### Account ID Format

- Default account: `'default'` (fixed ID)
- Custom accounts: `'account_' + timestamp` (e.g., `account_1732312345678`)
- Ensures unique IDs
- Timestamp provides creation order

### Settings Saved Per Account

All AutoChat settings are saved per account:
- `messageList` - Message list
- `sendMode` - Random/Sequential
- `minInterval`, `maxInterval` - Time intervals
- `dailyLimit` - Daily message limit
- `typingSimulation` - Enable/disable
- `variableDelays` - Enable/disable
- `antiRepetition` - Enable/disable
- `templateVariables` - Enable/disable
- `activeHours` - Enable/disable
- `activeHoursStart`, `activeHoursEnd` - Active hours
- `sendConfirmTimeout` - Confirmation timeout
- `mentionDetectionEnabled` - Mention detection
- `mentionKeywords` - Keywords array
- `mentionReplyMessages` - Reply messages array

### Performance

- **Switching Speed**: Instant (<100ms)
- **Storage Usage**: ~5KB per account (typical)
- **Max Accounts**: Limited only by storage quota (~5MB = ~1000 accounts)
- **Memory Usage**: Minimal (only current account in memory)

## Best Practices

### Naming Conventions

✅ Good Names:
- "Stake - Rain Farmer"
- "Work Slack Bot"
- "Casino #1 (VIP)"
- "Testing Environment"

❌ Poor Names:
- "Account 1" (not descriptive)
- "asdfgh" (meaningless)
- "a" (too short)
- Empty or whitespace

### Organization Tips

1. **Use Prefixes**: Group related accounts
   - "Casino 1 - Stake"
   - "Casino 2 - BC.Game"
   - "Casino 3 - Rollbit"

2. **Include Context**: Add relevant details
   - "Rain Farmer (Active 9AM-5PM)"
   - "VIP Account (High Roller)"
   - "Testing (DO NOT USE IN PROD)"

3. **Regular Backups**: Export important profiles
   - Weekly exports
   - Before major changes
   - Store in safe location

### Security

1. **Export Files**: Contain your settings
   - Don't share exports with keywords/passwords
   - Store securely
   - Delete exports after use

2. **Account Names**: Don't include sensitive info
   - ❌ "myemail@domain.com"
   - ✅ "Personal Account"

3. **Testing**: Use separate profile
   - Never test on production accounts
   - Create "Testing" profile
   - Verify before switching to real accounts

## Troubleshooting

### Account Not Switching

**Symptoms**: Dropdown changes but settings don't update

**Solutions**:
1. Refresh the popup (close and reopen)
2. Check browser console for errors
3. Verify account exists in storage
4. Try creating new account and switching to it

### Settings Not Saving

**Symptoms**: Changes are lost when switching accounts

**Solutions**:
1. Wait 1 second after making changes (auto-save delay)
2. Manually switch accounts to force save
3. Check browser storage quota
4. Verify no errors in console

### Can't Delete Account

**Possible Causes**:
1. Trying to delete "Default Account" (not allowed)
2. Trying to delete active account (switch first)
3. Account already deleted (refresh popup)

**Solution**: Switch to different account first, then delete

### Export File Invalid

**Symptoms**: Cannot import exported file

**Solutions**:
1. Verify file is valid JSON
2. Check file hasn't been corrupted
3. Re-export the account
4. Use file immediately after export

## API Reference

### Functions

```javascript
// Load all accounts from storage
async function loadAccounts()

// Save all accounts to storage
function saveAccounts()

// Update dropdown with account list
function updateAccountSelect()

// Update modal account list
function updateAccountList()

// Switch to different account
function switchAccount(accountId)

// Get current account settings
function getCurrentSettings()

// Export account to JSON file
function exportAccount(accountId)

// Delete account (with validation)
function deleteAccount(accountId)
```

### Storage Keys

```javascript
// Main storage keys
'accounts'        // Object containing all accounts
'currentAccount'  // String ID of active account

// Per-account settings (stored in accounts[accountId].settings)
'messageList'
'sendMode'
'minInterval'
'maxInterval'
// ... all other settings
```

## Future Enhancements

Potential improvements for future versions:

- [ ] Import account from JSON file
- [ ] Duplicate/clone existing account
- [ ] Account templates (pre-configured profiles)
- [ ] Account usage statistics
- [ ] Account sharing via encrypted link
- [ ] Account synchronization across browsers
- [ ] Account categories/folders
- [ ] Bulk account operations
- [ ] Account search/filter
- [ ] Recently used accounts

## Changelog

### v4.4.0 (2025-11-22)
- ✨ Initial release of multi-account support
- ✅ Create, switch, export, and delete accounts
- ✅ Complete settings isolation per account
- ✅ Protected default account
- ✅ Visual account selector in main UI
- ✅ Account management modal
- ✅ 14 comprehensive tests (109 total passing)

## Support

For issues or questions about multi-account support:

1. Check this documentation
2. Verify your browser storage quota
3. Check browser console for errors
4. Open an issue on [GitHub](https://github.com/sushiomsky/autochat/issues)

## License

This feature is part of AutoChat and is licensed under the MIT License.

---

**Perfect for Rain Farmers**: Manage multiple casino accounts with ease! Each profile keeps your keywords, replies, and settings completely separate. Switch accounts in one click and never mix up your configurations again.

🎰 Happy farming! 🌧️
