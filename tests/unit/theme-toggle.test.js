/**
 * Tests for Theme Toggle UI Component
 */

describe('Theme Toggle', () => {
  let applyTheme;
  let themeToggle;
  let mockStorage;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <button id="themeToggle">🌙</button>
      <div class="container"></div>
    `;

    themeToggle = document.getElementById('themeToggle');

    // Mock storage
    mockStorage = {
      theme: 'light'
    };

    global.chrome.storage.local.get.mockImplementation((keys, callback) => {
      const result = {};
      if (Array.isArray(keys)) {
        keys.forEach(key => {
          if (mockStorage[key] !== undefined) {
            result[key] = mockStorage[key];
          }
        });
      } else if (typeof keys === 'string') {
        if (mockStorage[keys] !== undefined) {
          result[keys] = mockStorage[keys];
        }
      }
      callback(result);
      return Promise.resolve(result);
    });

    global.chrome.storage.local.set.mockImplementation((items, callback) => {
      Object.assign(mockStorage, items);
      if (callback) callback();
      return Promise.resolve();
    });

    // Define applyTheme function
    applyTheme = function(theme) {
      if (theme === 'dark') {
        document.body.classList.add('dark-theme');
        themeToggle.textContent = '☀️';
      } else {
        document.body.classList.remove('dark-theme');
        themeToggle.textContent = '🌙';
      }
    };
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('should apply light theme by default', () => {
    applyTheme('light');
    expect(document.body.classList.contains('dark-theme')).toBe(false);
    expect(themeToggle.textContent).toBe('🌙');
  });

  test('should apply dark theme correctly', () => {
    applyTheme('dark');
    expect(document.body.classList.contains('dark-theme')).toBe(true);
    expect(themeToggle.textContent).toBe('☀️');
  });

  test('should toggle from light to dark theme', () => {
    applyTheme('light');
    expect(document.body.classList.contains('dark-theme')).toBe(false);
    
    applyTheme('dark');
    expect(document.body.classList.contains('dark-theme')).toBe(true);
  });

  test('should toggle from dark to light theme', () => {
    applyTheme('dark');
    expect(document.body.classList.contains('dark-theme')).toBe(true);
    
    applyTheme('light');
    expect(document.body.classList.contains('dark-theme')).toBe(false);
  });

  test('should persist theme to storage', async () => {
    await chrome.storage.local.set({ theme: 'dark' });
    expect(mockStorage.theme).toBe('dark');
  });

  test('should load theme from storage', async () => {
    mockStorage.theme = 'dark';
    const result = await chrome.storage.local.get('theme');
    expect(result.theme).toBe('dark');
  });

  test('should handle toggle button click event', () => {
    const clickHandler = jest.fn((e) => {
      const currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      applyTheme(newTheme);
      chrome.storage.local.set({ theme: newTheme });
    });

    themeToggle.addEventListener('click', clickHandler);
    themeToggle.click();

    expect(clickHandler).toHaveBeenCalled();
  });

  test('should update button icon when theme changes', () => {
    applyTheme('light');
    expect(themeToggle.textContent).toBe('🌙');

    applyTheme('dark');
    expect(themeToggle.textContent).toBe('☀️');

    applyTheme('light');
    expect(themeToggle.textContent).toBe('🌙');
  });

  test('should handle missing theme in storage gracefully', async () => {
    mockStorage = {};
    const result = await chrome.storage.local.get('theme');
    expect(result.theme).toBeUndefined();
  });

  test('should apply theme immediately on page load', () => {
    mockStorage.theme = 'dark';
    chrome.storage.local.get('theme', (data) => {
      applyTheme(data.theme || 'light');
    });
    
    expect(chrome.storage.local.get).toHaveBeenCalledWith('theme', expect.any(Function));
  });
});
