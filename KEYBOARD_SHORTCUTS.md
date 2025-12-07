# AutoChat Keyboard Shortcuts Reference

Quick reference guide for all keyboard shortcuts available in AutoChat Enhanced.

## Global Shortcuts

### Essential Commands
| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl+K` | Command Palette | Open quick command search |
| `Ctrl+S` | Save Settings | Save current configuration |
| `Ctrl+X` | Start/Stop | Toggle auto-send on/off |
| `Ctrl+P` | Pause/Resume | Pause or resume automation |
| `Escape` | Close Modal | Close any open modal dialog |

## Command Palette (Ctrl+K)

The Command Palette provides quick access to all features:

| Command | Action |
|---------|--------|
| **Start** | Start auto-send automation |
| **Stop** | Stop auto-send automation |
| **Pause** | Pause current automation |
| **Resume** | Resume paused automation |
| **Settings** | Open settings modal |
| **Preview** | Preview messages with variables |
| **Import** | Import settings from file |
| **Export** | Export settings to file |
| **Categories** | Open category manager |
| **Emojis** | Open emoji picker |
| **Help** | Open help documentation |
| **Notifications** | Open notification center |
| **Accounts** | Manage account profiles |
| **Theme** | Toggle dark/light mode |

### Navigation in Command Palette
- **Type** to search commands
- **↑ Up Arrow** - Move selection up
- **↓ Down Arrow** - Move selection down
- **Enter** - Execute selected command
- **Escape** - Close command palette

## Modal Navigation

### Common Modal Controls
| Key | Action |
|-----|--------|
| `Escape` | Close modal |
| `Enter` | Confirm action (in forms) |
| `Tab` | Next field |
| `Shift+Tab` | Previous field |

## Notification Center

| Action | How To |
|--------|--------|
| Open | Click bell icon (🔔) or use Command Palette |
| Mark Read | Click ✓ on individual notification |
| Mark All Read | Click "Mark All Read" button |
| Delete | Click 🗑️ on individual notification |
| Clear All | Click "Clear All" button |

## Emoji Picker

| Action | How To |
|--------|--------|
| Open | Click emoji button (😊) |
| Switch Category | Click category tabs |
| Search | Type in search box |
| Insert | Click emoji |
| Close | Click outside or press Escape |

## Text Input Shortcuts

### Message List Textarea
| Shortcut | Action |
|----------|--------|
| `Ctrl+A` | Select all text |
| `Ctrl+C` | Copy selected text |
| `Ctrl+V` | Paste text |
| `Ctrl+X` | Cut selected text |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |

## Settings Modal

| Section | Shortcut |
|---------|----------|
| Open | `Ctrl+,` (future) or ⚙️ button |
| Save & Close | Click "Save Settings" or `Ctrl+S` |
| Cancel | `Escape` |

## Template Variables

Quick insertion shortcuts (type these in your messages):

| Variable | Output | Example |
|----------|--------|---------|
| `{time}` | Current time | 3:45 PM |
| `{date}` | Current date | Dec 7, 2025 |
| `{random_emoji}` | Random emoji | 😊 🎉 ✨ |
| `{random_number}` | Random number | 42 |
| `{timestamp}` | Unix timestamp | 1701964800 |

## Browser Shortcuts

### Extension Management
| Shortcut | Action |
|----------|--------|
| `Alt+Shift+A` | Open AutoChat popup (custom) |
| Browser toolbar icon click | Open popup |

### Developer Mode
| Shortcut | Action |
|----------|--------|
| `F12` | Open DevTools (for debugging) |
| `Ctrl+Shift+I` | Open DevTools |
| `Ctrl+Shift+J` | Open Console |

## Accessibility Shortcuts

### Screen Reader Support
| Action | Key |
|--------|-----|
| Navigate buttons | `Tab` |
| Activate button | `Space` or `Enter` |
| Navigate headings | `H` (screen reader) |
| Navigate form fields | `F` (screen reader) |

## Tips & Tricks

### Productivity Boosters
1. **Quick Start**: `Ctrl+K` → type "start" → `Enter`
2. **Emergency Stop**: `Ctrl+X` to immediately stop
3. **Preview Before Send**: `Ctrl+K` → "preview" → check messages
4. **Fast Settings**: `Ctrl+S` auto-saves all changes
5. **Dark Mode Toggle**: `Ctrl+K` → "theme"

### Power User Workflows

#### Workflow 1: Quick Message Test
1. `Ctrl+K` → "preview" → `Enter`
2. Review first 10 messages
3. `Escape` to close
4. `Ctrl+X` to start sending

#### Workflow 2: Category Organization
1. `Ctrl+K` → "categories" → `Enter`
2. Create new categories
3. Organize messages by category
4. `Escape` to close

#### Workflow 3: Multi-Account Switching
1. Click account dropdown
2. Select different profile
3. Settings automatically load
4. Start automation for that account

## Customization

### Future Custom Shortcuts (Planned)
- Configure custom keyboard shortcuts
- Create custom commands
- Macro recording
- Quick actions

## Mobile Considerations

Note: Keyboard shortcuts are primarily for desktop use. Mobile app (planned v5.0) will have:
- Gesture controls
- Quick action buttons
- Voice commands (optional)

## Troubleshooting

### Shortcuts Not Working?

1. **Check if modal is open**: Some shortcuts only work in specific contexts
2. **Browser extensions conflict**: Some extensions override shortcuts
3. **Focus issues**: Click inside the popup first
4. **Custom browser shortcuts**: Check if browser uses the same shortcut

### Common Conflicts
- `Ctrl+S` - Browser "Save Page" (disabled in extension)
- `Ctrl+P` - Browser "Print" (disabled in extension)
- `Ctrl+K` - Browser search (varies by browser)

### Solutions
- Use Command Palette (`Ctrl+K`) for most actions
- Click buttons if shortcuts conflict
- Check browser shortcut settings
- Use different keyboard layout if needed

## Platform Differences

### Windows/Linux
All shortcuts as listed above

### macOS
Replace `Ctrl` with `Cmd`:
- `Cmd+K` - Command Palette
- `Cmd+S` - Save Settings
- `Cmd+X` - Start/Stop
- `Cmd+P` - Pause/Resume

### ChromeOS
Use `Ctrl` as specified above

## Quick Reference Card

```
╔══════════════════════════════════════╗
║     AutoChat Quick Reference         ║
╠══════════════════════════════════════╣
║ Ctrl+K    Command Palette            ║
║ Ctrl+X    Start/Stop                 ║
║ Ctrl+P    Pause/Resume               ║
║ Ctrl+S    Save Settings              ║
║ Escape    Close Modal                ║
║                                      ║
║ In Command Palette:                  ║
║ ↑↓        Navigate                   ║
║ Enter     Execute                    ║
║ Type      Search                     ║
╚══════════════════════════════════════╝
```

## See Also

- [README.md](README.md) - Main documentation
- [QUICKSTART.md](QUICKSTART.md) - Getting started guide
- [FEATURES_SUMMARY.md](FEATURES_SUMMARY.md) - Complete feature list
- [CONTRIBUTING.md](CONTRIBUTING.md) - Development guide

---

**Last Updated**: December 7, 2025  
**Version**: v4.4.0  
**Status**: Complete for current release

For feature requests or shortcut suggestions, please open an issue on GitHub.
