/**
 * Language-specific Phrase Loading Tests
 */

// Helper function to simulate phrase loading
const createLoadPhrasesFunction = () => {
  return async () => {
    const storageData = await new Promise(resolve => {
      chrome.storage.local.get(['locale'], resolve);
    });
    const locale = storageData.locale || chrome.i18n.getUILanguage().split('-')[0] || 'en';
    
    let phraseFile = `farming_phrases_${locale}.txt`;
    let response;
    
    try {
      response = await fetch(chrome.runtime.getURL(phraseFile));
      if (!response.ok) throw new Error('File not found');
    } catch (err) {
      phraseFile = 'farming_phrases_en.txt';
      response = await fetch(chrome.runtime.getURL(phraseFile));
    }
    
    const text = await response.text();
    return text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  };
};

describe('Language-specific Phrase Loading', () => {
  beforeEach(() => {
    // Reset chrome storage mock
    global.chrome.storage.local.get.mockClear();
    global.chrome.i18n.getUILanguage.mockClear();
  });

  test('should load English phrases by default', async () => {
    // Mock fetch to simulate loading English phrases
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve('English phrase 1\nEnglish phrase 2\nEnglish phrase 3')
      })
    );

    global.chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({});
    });

    global.chrome.i18n.getUILanguage.mockReturnValue('en');

    const loadPhrases = createLoadPhrasesFunction();
    const phrases = await loadPhrases();
    
    expect(phrases).toHaveLength(3);
    expect(phrases[0]).toBe('English phrase 1');
    expect(fetch).toHaveBeenCalled();
  });

  test('should load Urdu phrases when locale is set to ur', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve('اردو جملہ 1\nاردو جملہ 2')
      })
    );

    global.chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({ locale: 'ur' });
    });

    const loadPhrases = createLoadPhrasesFunction();
    const phrases = await loadPhrases();
    
    expect(phrases).toHaveLength(2);
    expect(phrases[0]).toBe('اردو جملہ 1');
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('farming_phrases_ur.txt'));
  });

  test('should load Spanish phrases when locale is set to es', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve('Frase española 1\nFrase española 2\nFrase española 3')
      })
    );

    global.chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({ locale: 'es' });
    });

    const loadPhrases = createLoadPhrasesFunction();
    const phrases = await loadPhrases();
    
    expect(phrases).toHaveLength(3);
    expect(phrases[0]).toBe('Frase española 1');
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('farming_phrases_es.txt'));
  });

  test('should fallback to English when language file is not found', async () => {
    let callCount = 0;
    global.fetch = jest.fn(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          ok: false,
          text: () => Promise.reject('File not found')
        });
      }
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve('English fallback phrase 1\nEnglish fallback phrase 2')
      });
    });

    global.chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({ locale: 'fr' }); // French not yet supported
    });

    const loadPhrases = createLoadPhrasesFunction();
    const phrases = await loadPhrases();
    
    expect(phrases).toHaveLength(2);
    expect(phrases[0]).toBe('English fallback phrase 1');
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  test('should handle browser locale with region code (e.g., en-US)', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve('English phrase from en-US')
      })
    );

    global.chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({});
    });

    global.chrome.i18n.getUILanguage.mockReturnValue('en-US');

    const loadPhrases = createLoadPhrasesFunction();
    const phrases = await loadPhrases();
    
    expect(phrases).toHaveLength(1);
    expect(phrases[0]).toBe('English phrase from en-US');
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('farming_phrases_en.txt'));
  });
});
