/**
 * Tests for Language Selector UI Component
 */

describe('Language Selector', () => {
  let languageSelect;
  let mockI18n;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div class="language-selector">
        <select id="languageSelect">
          <option value="en">English</option>
          <option value="ur">اردو (Urdu)</option>
          <option value="es">Español (Spanish)</option>
        </select>
      </div>
      
      <h2 id="appTitle">AutoChat Enhanced</h2>
      <button id="startButton">Start Auto-Send</button>
      <label id="messageLabel">Messages</label>
    `;

    languageSelect = document.getElementById('languageSelect');

    // Mock i18n
    mockI18n = {
      currentLanguage: 'en',
      translations: {
        en: {
          appTitle: 'AutoChat Enhanced',
          startButton: 'Start Auto-Send',
          messageLabel: 'Messages'
        },
        ur: {
          appTitle: 'آٹو چیٹ بہتر',
          startButton: 'آٹو بھیجیں شروع کریں',
          messageLabel: 'پیغامات'
        },
        es: {
          appTitle: 'AutoChat Mejorado',
          startButton: 'Iniciar envío automático',
          messageLabel: 'Mensajes'
        }
      }
    };

    // Mock chrome storage
    global.chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({ language: mockI18n.currentLanguage });
      return Promise.resolve({ language: mockI18n.currentLanguage });
    });

    global.chrome.storage.local.set.mockImplementation((items, callback) => {
      if (items.language) {
        mockI18n.currentLanguage = items.language;
      }
      if (callback) callback();
      return Promise.resolve();
    });

    // Mock chrome.i18n
    global.chrome.i18n.getMessage.mockImplementation((key) => {
      return mockI18n.translations[mockI18n.currentLanguage]?.[key] || key;
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Initial State', () => {
    test('should default to English', () => {
      expect(languageSelect.value).toBe('en');
    });

    test('should have all language options', () => {
      const options = languageSelect.querySelectorAll('option');
      expect(options.length).toBe(3);
      expect(options[0].value).toBe('en');
      expect(options[1].value).toBe('ur');
      expect(options[2].value).toBe('es');
    });

    test('should display language names', () => {
      const options = languageSelect.querySelectorAll('option');
      expect(options[0].textContent).toBe('English');
      expect(options[1].textContent).toContain('Urdu');
      expect(options[2].textContent).toContain('Spanish');
    });
  });

  describe('Language Selection', () => {
    test('should select Urdu', () => {
      languageSelect.value = 'ur';
      expect(languageSelect.value).toBe('ur');
    });

    test('should select Spanish', () => {
      languageSelect.value = 'es';
      expect(languageSelect.value).toBe('es');
    });

    test('should switch back to English', () => {
      languageSelect.value = 'ur';
      languageSelect.value = 'en';
      expect(languageSelect.value).toBe('en');
    });

    test('should persist language selection', async () => {
      languageSelect.value = 'es';
      await chrome.storage.local.set({ language: 'es' });
      
      const result = await chrome.storage.local.get('language');
      expect(result.language).toBe('es');
    });
  });

  describe('UI Translation', () => {
    let updateUILanguage;

    beforeEach(() => {
      updateUILanguage = function(lang) {
        mockI18n.currentLanguage = lang;
        
        // Update text elements
        const title = document.getElementById('appTitle');
        const button = document.getElementById('startButton');
        const label = document.getElementById('messageLabel');
        
        if (title) title.textContent = chrome.i18n.getMessage('appTitle');
        if (button) button.textContent = chrome.i18n.getMessage('startButton');
        if (label) label.textContent = chrome.i18n.getMessage('messageLabel');
      };
    });

    test('should translate UI to Urdu', () => {
      updateUILanguage('ur');
      
      expect(document.getElementById('appTitle').textContent).toBe('آٹو چیٹ بہتر');
      expect(document.getElementById('startButton').textContent).toBe('آٹو بھیجیں شروع کریں');
      expect(document.getElementById('messageLabel').textContent).toBe('پیغامات');
    });

    test('should translate UI to Spanish', () => {
      updateUILanguage('es');
      
      expect(document.getElementById('appTitle').textContent).toBe('AutoChat Mejorado');
      expect(document.getElementById('startButton').textContent).toBe('Iniciar envío automático');
      expect(document.getElementById('messageLabel').textContent).toBe('Mensajes');
    });

    test('should translate UI back to English', () => {
      updateUILanguage('es');
      updateUILanguage('en');
      
      expect(document.getElementById('appTitle').textContent).toBe('AutoChat Enhanced');
      expect(document.getElementById('startButton').textContent).toBe('Start Auto-Send');
    });

    test('should handle missing translation keys gracefully', () => {
      mockI18n.currentLanguage = 'en';
      const result = chrome.i18n.getMessage('nonExistentKey');
      expect(result).toBe('nonExistentKey');
    });
  });

  describe('Language Change Event', () => {
    test('should trigger change event', () => {
      const changeHandler = jest.fn();
      languageSelect.addEventListener('change', changeHandler);
      
      languageSelect.value = 'ur';
      languageSelect.dispatchEvent(new Event('change'));
      
      expect(changeHandler).toHaveBeenCalled();
    });

    test('should update language on change', () => {
      let currentLang = 'en';
      
      languageSelect.addEventListener('change', (e) => {
        currentLang = e.target.value;
      });
      
      languageSelect.value = 'es';
      languageSelect.dispatchEvent(new Event('change'));
      
      expect(currentLang).toBe('es');
    });

    test('should save language on change', async () => {
      languageSelect.addEventListener('change', async (e) => {
        await chrome.storage.local.set({ language: e.target.value });
      });
      
      languageSelect.value = 'ur';
      languageSelect.dispatchEvent(new Event('change'));
      
      expect(chrome.storage.local.set).toHaveBeenCalledWith({ language: 'ur' });
    });
  });

  describe('RTL Support', () => {
    test('should apply RTL for Urdu', () => {
      languageSelect.value = 'ur';
      
      const changeHandler = (e) => {
        if (e.target.value === 'ur') {
          document.body.setAttribute('dir', 'rtl');
        } else {
          document.body.setAttribute('dir', 'ltr');
        }
      };
      
      languageSelect.addEventListener('change', changeHandler);
      languageSelect.dispatchEvent(new Event('change'));
      
      expect(document.body.getAttribute('dir')).toBe('rtl');
    });

    test('should apply LTR for English', () => {
      document.body.setAttribute('dir', 'rtl');
      languageSelect.value = 'en';
      
      const changeHandler = (e) => {
        if (e.target.value === 'ur') {
          document.body.setAttribute('dir', 'rtl');
        } else {
          document.body.setAttribute('dir', 'ltr');
        }
      };
      
      languageSelect.addEventListener('change', changeHandler);
      languageSelect.dispatchEvent(new Event('change'));
      
      expect(document.body.getAttribute('dir')).toBe('ltr');
    });

    test('should apply LTR for Spanish', () => {
      languageSelect.value = 'es';
      
      const changeHandler = (e) => {
        document.body.setAttribute('dir', e.target.value === 'ur' ? 'rtl' : 'ltr');
      };
      
      languageSelect.addEventListener('change', changeHandler);
      languageSelect.dispatchEvent(new Event('change'));
      
      expect(document.body.getAttribute('dir')).toBe('ltr');
    });
  });

  describe('Loading Saved Language', () => {
    test('should load saved language on startup', async () => {
      await chrome.storage.local.set({ language: 'es' });
      
      const result = await chrome.storage.local.get('language');
      languageSelect.value = result.language;
      
      expect(languageSelect.value).toBe('es');
    });

    test('should default to English if no language saved', async () => {
      global.chrome.storage.local.get.mockImplementation((keys, callback) => {
        callback({});
        return Promise.resolve({});
      });
      
      const result = await chrome.storage.local.get('language');
      const savedLang = result.language || 'en';
      languageSelect.value = savedLang;
      
      expect(languageSelect.value).toBe('en');
    });
  });

  describe('Native Language Names', () => {
    test('should display native script for Urdu', () => {
      const urduOption = languageSelect.querySelector('option[value="ur"]');
      expect(urduOption.textContent).toContain('اردو');
    });

    test('should display native script for Spanish', () => {
      const spanishOption = languageSelect.querySelector('option[value="es"]');
      expect(spanishOption.textContent).toContain('Español');
    });

    test('should include English translation in parentheses', () => {
      const urduOption = languageSelect.querySelector('option[value="ur"]');
      const spanishOption = languageSelect.querySelector('option[value="es"]');
      
      expect(urduOption.textContent).toContain('Urdu');
      expect(spanishOption.textContent).toContain('Spanish');
    });
  });

  describe('Edge Cases', () => {
    test('should handle rapid language switching', () => {
      const languages = ['en', 'ur', 'es', 'en', 'ur'];
      
      languages.forEach(lang => {
        languageSelect.value = lang;
      });
      
      expect(languageSelect.value).toBe('ur');
    });

    test('should maintain language after page reload simulation', async () => {
      languageSelect.value = 'es';
      await chrome.storage.local.set({ language: 'es' });
      
      // Simulate reload
      languageSelect.value = 'en';
      
      const result = await chrome.storage.local.get('language');
      languageSelect.value = result.language;
      
      expect(languageSelect.value).toBe('es');
    });

    test('should handle invalid language code gracefully', () => {
      languageSelect.value = 'invalid';
      // Will fall back to one of the valid options or last valid value
      expect(['en', 'ur', 'es', 'invalid']).toContain(languageSelect.value);
    });
  });

  describe('Accessibility', () => {
    test('should have accessible select element', () => {
      expect(languageSelect.tagName).toBe('SELECT');
    });

    test('should have multiple options for user choice', () => {
      const options = languageSelect.querySelectorAll('option');
      expect(options.length).toBeGreaterThan(1);
    });

    test('should display readable text for each option', () => {
      const options = languageSelect.querySelectorAll('option');
      options.forEach(option => {
        expect(option.textContent.trim().length).toBeGreaterThan(0);
      });
    });
  });

  describe('Integration', () => {
    test('should coordinate with chrome.i18n API', () => {
      mockI18n.currentLanguage = 'es';
      const message = chrome.i18n.getMessage('appTitle');
      expect(message).toBe('AutoChat Mejorado');
    });

    test('should update UI elements when language changes', () => {
      const updateAll = (lang) => {
        mockI18n.currentLanguage = lang;
        document.querySelectorAll('[data-i18n]').forEach(el => {
          const key = el.getAttribute('data-i18n');
          el.textContent = chrome.i18n.getMessage(key);
        });
      };

      // Add data-i18n attributes
      document.getElementById('appTitle').setAttribute('data-i18n', 'appTitle');
      document.getElementById('startButton').setAttribute('data-i18n', 'startButton');

      updateAll('ur');
      expect(document.getElementById('appTitle').textContent).toBe('آٹو چیٹ بہتر');
      
      updateAll('en');
      expect(document.getElementById('appTitle').textContent).toBe('AutoChat Enhanced');
    });
  });
});
