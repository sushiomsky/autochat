# Multi-Language Farming Phrases

AutoChat now supports language-specific farming phrase libraries! The extension will automatically load phrases in the user's preferred language.

## Supported Languages

The extension now includes farming phrases in the following languages:

### 1. **English (en)** - Default

- File: `farming_phrases_en.txt`
- 671+ phrases
- Original English phrases with casino and gaming humor

### 2. **Urdu (ur)** - اردو

- File: `farming_phrases_ur.txt`
- 300+ phrases
- Culturally adapted phrases for Urdu-speaking users
- Includes gaming and casino-themed humor translated to Urdu

### 3. **Spanish (es)** - Español

- File: `farming_phrases_es.txt`
- 300+ phrases
- Spanish translations with culturally relevant humor
- Casino and gaming phrases adapted for Spanish-speaking users

## How It Works

### Automatic Language Detection

1. When the user opens the extension, it checks their language preference
2. The system looks for `farming_phrases_{locale}.txt` based on:
   - User's selected language in the extension settings
   - Browser's UI language setting
   - Falls back to English if language-specific file not found

### Language Selection

Users can manually select their preferred language:

1. Open the AutoChat extension popup
2. Use the language selector dropdown in the top-right corner
3. Choose from:
   - English
   - اردو (Urdu)
   - Español (Spanish)
4. The extension will reload and load phrases in the selected language

### Implementation Details

The phrase loading logic in `popup-enhanced.js`:

```javascript
async function loadDefaultPhrasesFromFile() {
  try {
    // Get current locale from storage or browser default
    const storageData = await new Promise((resolve) => {
      chrome.storage.local.get(['locale'], resolve);
    });
    const locale = storageData.locale || chrome.i18n.getUILanguage().split('-')[0] || 'en';

    // Try to load language-specific phrases, fallback to English
    let phraseFile = `farming_phrases_${locale}.txt`;
    let response;

    try {
      response = await fetch(chrome.runtime.getURL(phraseFile));
      if (!response.ok) throw new Error('File not found');
    } catch (err) {
      console.log(`[AutoChat] ${phraseFile} not found, falling back to English`);
      phraseFile = 'farming_phrases_en.txt';
      response = await fetch(chrome.runtime.getURL(phraseFile));
    }

    const text = await response.text();
    defaultPhrases = text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    console.log(`[AutoChat] Loaded ${defaultPhrases.length} default phrases from ${phraseFile}`);
    return defaultPhrases;
  } catch (error) {
    console.error('[AutoChat] Error loading default phrases:', error);
    return [];
  }
}
```

## Adding a New Language

To add support for a new language:

### 1. Create Phrase File

Create a new file `farming_phrases_{language_code}.txt` in the root directory:

```bash
# Example for French (fr)
touch farming_phrases_fr.txt
```

Add translated phrases, one per line (see existing files for examples).

### 2. Add Localization Messages

Create `_locales/{language_code}/messages.json`:

```bash
mkdir -p _locales/fr
touch _locales/fr/messages.json
```

Translate all UI strings (use `_locales/en/messages.json` as template).

### 3. Update i18n Configuration

Edit `src/i18n.js`:

```javascript
// Add language code to supported locales
this.supportedLocales = ['en', 'ur', 'es', 'fr'];

// Add to getSupportedLocales() method
getSupportedLocales() {
  return [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
    { code: 'fr', name: 'French', nativeName: 'Français' }
  ];
}

// If language is RTL, add to isRTL() method
isRTL(locale = null) {
  const checkLocale = locale || this.currentLocale;
  const rtlLocales = ['ar', 'he', 'fa', 'ur'];  // Add RTL languages here
  return rtlLocales.includes(checkLocale);
}
```

### 4. Update Language Selector

Edit `popup-enhanced.html`:

```html
<select id="languageSelect">
  <option value="en">English</option>
  <option value="ur">اردو (Urdu)</option>
  <option value="es">Español (Spanish)</option>
  <option value="fr">Français (French)</option>
</select>
```

### 5. Update Build Configuration

Edit `scripts/build.js` to include the new phrase file:

```javascript
const filesToCopy = [
  'manifest.json',
  'farming_phrases.txt',
  'farming_phrases_en.txt',
  'farming_phrases_ur.txt',
  'farming_phrases_es.txt',
  'farming_phrases_fr.txt', // Add new language
  // ... other files
];
```

Edit `manifest.json` to make the file web accessible:

```json
"web_accessible_resources": [
  {
    "resources": [
      "farming_phrases.txt",
      "farming_phrases_en.txt",
      "farming_phrases_ur.txt",
      "farming_phrases_es.txt",
      "farming_phrases_fr.txt"
    ],
    "matches": ["<all_urls>"]
  }
]
```

### 6. Add Tests

Create tests in `tests/unit/language-phrases.test.js` for the new language:

```javascript
test('should load French phrases when locale is set to fr', async () => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      text: () => Promise.resolve('Phrase française 1\nPhrase française 2'),
    })
  );

  global.chrome.storage.local.get.mockImplementation((keys, callback) => {
    callback({ locale: 'fr' });
  });

  const phrases = await loadPhrases();

  expect(phrases).toHaveLength(2);
  expect(phrases[0]).toBe('Phrase française 1');
});
```

### 7. Build and Test

```bash
npm run build
npm test
npm run lint
```

## File Structure

```
autochat/
├── farming_phrases.txt           # Legacy file (English)
├── farming_phrases_en.txt        # English phrases (671+)
├── farming_phrases_ur.txt        # Urdu phrases (300+)
├── farming_phrases_es.txt        # Spanish phrases (300+)
├── _locales/
│   ├── en/
│   │   └── messages.json         # English UI strings
│   ├── ur/
│   │   └── messages.json         # Urdu UI strings
│   └── es/
│       └── messages.json         # Spanish UI strings
├── src/
│   └── i18n.js                   # Internationalization module
├── popup-enhanced.js             # Includes loadDefaultPhrasesFromFile()
├── popup-enhanced.html           # Language selector
└── tests/
    └── unit/
        └── language-phrases.test.js  # Language phrase loading tests
```

## Translation Guidelines

When creating phrases for a new language:

1. **Cultural Adaptation**: Don't just translate literally - adapt jokes and humor for the target culture
2. **Gaming Context**: Maintain the casino/gaming theme that's common across all languages
3. **Variety**: Include different types of phrases:
   - Humorous observations about luck
   - Self-deprecating humor about losses
   - Playful references to the "duck" mascot
   - RNG (Random Number Generator) jokes
   - Balance and betting commentary
4. **Length**: Aim for 200-300 phrases minimum per language
5. **Format**: One phrase per line, no numbering needed
6. **Encoding**: Use UTF-8 encoding for all text files

## Testing Language-Specific Phrases

### Manual Testing

1. Open the extension in Chrome
2. Change language in the dropdown
3. Click "Load Phrases" button
4. Verify phrases appear in the correct language
5. Test with "Random order" mode to see variety

### Automated Testing

Run the test suite:

```bash
npm test
```

Language-specific tests verify:

- Correct file loading based on locale
- Fallback to English for unsupported languages
- Browser locale detection with region codes
- Phrase parsing and filtering

## Browser Compatibility

The multi-language phrase system works with:

- Chrome Extension Manifest V3
- Chrome i18n API
- Standard fetch API for loading files
- LocalStorage for saving user preferences

## Performance

- Phrase files are loaded once when the popup opens
- Files are cached by the browser
- Minimal performance impact (< 50ms loading time)
- Total size of all phrase files: ~70KB

## Future Enhancements

Planned additions:

- Arabic (ar) - RTL support
- French (fr)
- German (de)
- Portuguese (pt)
- Hindi (hi)
- Turkish (tr)
- Russian (ru)
- Chinese (zh)
- Japanese (ja)

## Support

For issues or questions about multi-language phrases:

- Open an issue on GitHub with the `i18n` label
- Include your language preference and browser locale
- Provide console logs if phrases aren't loading

---

**Version**: 4.3.0+
**Last Updated**: 2025-11-22
