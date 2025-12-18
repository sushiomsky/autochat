# Localization Guide

AutoChat Enhanced now supports multiple languages with full internationalization (i18n) support.

## Supported Languages

- **English (en)** - Default language
- **Urdu (ur)** - اردو - Full RTL support

## Features

### 1. **Full UI Localization**

- All user interface elements are translated
- Dynamic content updates based on selected language
- Persistent language preference across sessions

### 2. **RTL Support**

- Right-to-Left layout for Urdu and other RTL languages
- Proper text alignment and direction
- Flipped UI elements (buttons, modals, lists)
- Custom fonts for better Urdu rendering

### 3. **Chrome Extension i18n API**

- Uses native Chrome Extension localization system
- Message files in `_locales/` directory
- Manifest localization for extension name and description

## File Structure

```
autochat/
├── _locales/
│   ├── en/
│   │   └── messages.json          # English translations
│   └── ur/
│       └── messages.json          # Urdu translations
├── src/
│   ├── i18n.js                    # i18n utility module
│   └── popup-i18n.js              # Popup localization integration
├── manifest.json                  # Updated with default_locale
├── popup-enhanced.html            # Language selector added
├── popup-enhanced.js              # Localization support added
└── styles.css                     # RTL styles added
```

## Adding a New Language

### Step 1: Create Message File

Create a new directory in `_locales/` with the language code (e.g., `es` for Spanish):

```bash
mkdir -p _locales/es
```

Create `messages.json` in that directory using the English version as a template.

### Step 2: Update Language Selector

Add the new language option in `popup-enhanced.html`:

```html
<select id="languageSelect">
  <option value="en">English</option>
  <option value="ur">اردو (Urdu)</option>
  <option value="es">Español (Spanish)</option>
</select>
```

### Step 3: Update i18n Module

Add the language code to `src/i18n.js`:

```javascript
this.supportedLocales = ['en', 'ur', 'es'];
```

Add to `getSupportedLocales()` method:

```javascript
{ code: 'es', name: 'Spanish', nativeName: 'Español' }
```

If the language is RTL, add it to `isRTL()` method:

```javascript
const rtlLocales = ['ar', 'he', 'fa', 'ur', 'yi'];
```

## Message File Structure

Each message in `messages.json` has this structure:

```json
{
  "messageName": {
    "message": "The translated text",
    "description": "Optional description for translators"
  }
}
```

### Example Entry

```json
{
  "startAutoSend": {
    "message": "Start Auto-Send",
    "description": "Button text to start automatic message sending"
  }
}
```

### With Substitutions

For messages with dynamic content:

```json
{
  "phrasesLoaded": {
    "message": "Loaded $COUNT$ phrases ($CUSTOM$ custom + $DEFAULT$ default)",
    "description": "Success message showing number of phrases loaded",
    "placeholders": {
      "count": {
        "content": "$1",
        "example": "100"
      },
      "custom": {
        "content": "$2",
        "example": "10"
      },
      "default": {
        "content": "$3",
        "example": "90"
      }
    }
  }
}
```

## Using Localization in Code

### In popup-i18n.js

Use the `t()` function (translation function):

```javascript
const text = t('messageName');
const textWithSubs = t('messageName', ['substitution1', 'substitution2']);
```

### In HTML (Data Attributes)

Add data attributes for automatic localization:

```html
<!-- Localize text content -->
<button data-i18n="startAutoSend">Start Auto-Send</button>

<!-- Localize placeholder -->
<input data-i18n-placeholder="searchPlaceholder" />

<!-- Localize title -->
<button data-i18n-title="helpButton">?</button>

<!-- Localize aria-label -->
<button data-i18n-aria="themeToggle">🌙</button>

<!-- With substitutions -->
<span data-i18n="greetingUser" data-i18n-subs='["John"]'>Hello, John!</span>
```

Then call `localizePopup()` to apply:

```javascript
if (typeof localizePopup === 'function') {
  localizePopup();
}
```

### Direct Chrome API Usage

```javascript
// Get message
const message = chrome.i18n.getMessage('messageName');

// With substitutions
const messageWithSubs = chrome.i18n.getMessage('messageName', ['sub1', 'sub2']);

// Get UI language
const language = chrome.i18n.getUILanguage();
```

## RTL Styling

RTL languages automatically get:

1. **Document direction**: `<html dir="rtl">`
2. **CSS class**: `.rtl` on `<body>`
3. **Font family**: Urdu-specific fonts loaded
4. **Flipped layouts**: Flex containers reversed

### CSS for RTL

Use attribute selectors:

```css
/* Apply to RTL languages */
[dir='rtl'] .my-element {
  margin-left: 0;
  margin-right: 10px;
}
```

Or class selectors:

```css
.rtl .my-element {
  text-align: right;
}
```

## Testing Localization

### 1. Manual Testing

1. Open the extension popup
2. Select a language from the dropdown
3. Extension will reload with new language
4. Verify all UI elements are translated
5. Check RTL layout for Urdu

### 2. Test Different Locales

Override Chrome's locale for testing:

```bash
# Linux
google-chrome --lang=ur

# Windows
chrome.exe --lang=ur

# macOS
open -a "Google Chrome" --args --lang=ur
```

### 3. Verify Message Files

Check all message keys are present:

```bash
# Compare keys between language files
diff <(jq -r 'keys[]' _locales/en/messages.json | sort) \
     <(jq -r 'keys[]' _locales/ur/messages.json | sort)
```

## Translation Guidelines

### For Translators

1. **Keep formatting**: Preserve emojis, HTML tags, and placeholders
2. **Context matters**: Read the description field
3. **Be concise**: Match the tone and length of original
4. **Test in UI**: See how it looks in the actual interface
5. **Cultural adaptation**: Adapt idioms and expressions

### Message Keys

- Use descriptive names: `startAutoSend` not `button1`
- Group related messages: `analytics*`, `settings*`
- Keep consistent naming: `Btn` for buttons, `Label` for labels

### Text Length

Be aware that translations can be longer or shorter:

- German: typically 30% longer
- Chinese: typically 30% shorter
- Arabic/Urdu: varies with RTL considerations

Ensure UI accommodates different text lengths.

## Common Issues

### 1. Missing Translations

**Problem**: Text shows key name instead of translation

**Solution**: Add the missing key to `messages.json`

### 2. RTL Layout Issues

**Problem**: Elements misaligned in RTL mode

**Solution**: Add specific RTL CSS rules in `styles.css`

### 3. Language Not Persisting

**Problem**: Language resets after closing popup

**Solution**: Verify `chrome.storage.local.set({ locale })` is called

### 4. Mixed Direction Text

**Problem**: English words in Urdu text appear reversed

**Solution**: Use Unicode direction markers or wrap in `<span dir="ltr">`

## Performance

- Localization files are cached by Chrome
- No network requests needed
- Minimal performance impact (< 50ms)
- Messages loaded synchronously

## Future Languages

Planned language additions:

- Arabic (ar) - RTL
- Hindi (hi)
- Spanish (es)
- French (fr)
- German (de)
- Portuguese (pt)
- Turkish (tr)

## Resources

- [Chrome Extension i18n](https://developer.chrome.com/docs/extensions/reference/i18n/)
- [Intl API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl)
- [RTL Best Practices](https://rtlstyling.com/)
- [Unicode Bidirectional Algorithm](https://unicode.org/reports/tr9/)

## Contributing

To contribute translations:

1. Fork the repository
2. Create a new language directory in `_locales/`
3. Translate all messages in `messages.json`
4. Test the translation in the extension
5. Submit a pull request

For questions or issues, open a GitHub issue with the `i18n` label.

---

**Last Updated**: 2025-11-08
**Version**: 4.3.0 with i18n support
