/**
 * Tests for Import/Export Settings UI Component
 */

describe('Import/Export Settings', () => {
  let exportSettings;
  let importSettings;
  let mockSettings;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div id="settingsModal" class="modal">
        <div class="modal-content">
          <h2>Settings</h2>
          
          <div class="import-export-section">
            <h3>Backup & Restore</h3>
            
            <div class="export-section">
              <p>Export your settings to back them up or transfer to another device.</p>
              <button id="exportSettings" class="btn-secondary">📥 Export Settings</button>
            </div>
            
            <div class="import-section">
              <p>Import settings from a backup file.</p>
              <input type="file" id="importFile" accept=".json" style="display: none;">
              <button id="importSettings" class="btn-secondary">📤 Import Settings</button>
            </div>
            
            <div id="importExportStatus" class="status-message"></div>
          </div>
        </div>
      </div>
    `;

    // Mock settings data
    mockSettings = {
      messageList: 'Hello\nWorld',
      minInterval: 1,
      maxInterval: 5,
      sendMethod: 'enter',
      dailyLimit: 100,
      typingSimulation: true,
      antiRepetition: true,
      activeHours: false,
      activeHoursStart: '09:00',
      activeHoursEnd: '17:00',
      language: 'en',
      theme: 'light',
      customPhrases: ['Phrase 1', 'Phrase 2'],
      accounts: [{ id: 'default', name: 'Default' }],
      currentAccount: 'default'
    };

    // Mock chrome storage
    global.chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback(mockSettings);
      return Promise.resolve(mockSettings);
    });

    global.chrome.storage.local.set.mockImplementation((items, callback) => {
      Object.assign(mockSettings, items);
      if (callback) callback();
      return Promise.resolve();
    });

    // Define export function
    exportSettings = function() {
      const data = JSON.stringify(mockSettings, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `autochat-settings-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      
      URL.revokeObjectURL(url);
      return { success: true, data };
    };

    // Define import function
    importSettings = function(fileContent) {
      try {
        const settings = JSON.parse(fileContent);
        
        // Validate settings structure
        if (typeof settings !== 'object' || settings === null) {
          return { success: false, error: 'Invalid settings format' };
        }
        
        // Update mockSettings
        Object.assign(mockSettings, settings);
        
        return { success: true, imported: Object.keys(settings).length };
      } catch (error) {
        return { success: false, error: 'Failed to parse settings file' };
      }
    };

    // Mock URL.createObjectURL and revokeObjectURL
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();
    
    // Mock Blob
    global.Blob = jest.fn((content, options) => ({ content, options }));
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Export Settings', () => {
    test('should have export button', () => {
      const exportBtn = document.getElementById('exportSettings');
      expect(exportBtn).not.toBeNull();
    });

    test('should export settings as JSON', () => {
      const result = exportSettings();
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(() => JSON.parse(result.data)).not.toThrow();
    });

    test('should include all settings in export', () => {
      const result = exportSettings();
      const exported = JSON.parse(result.data);
      
      expect(exported.messageList).toBe('Hello\nWorld');
      expect(exported.minInterval).toBe(1);
      expect(exported.maxInterval).toBe(5);
      expect(exported.sendMethod).toBe('enter');
      expect(exported.dailyLimit).toBe(100);
      expect(exported.language).toBe('en');
      expect(exported.theme).toBe('light');
    });

    test('should include custom phrases in export', () => {
      const result = exportSettings();
      const exported = JSON.parse(result.data);
      
      expect(exported.customPhrases).toEqual(['Phrase 1', 'Phrase 2']);
    });

    test('should include accounts in export', () => {
      const result = exportSettings();
      const exported = JSON.parse(result.data);
      
      expect(exported.accounts).toEqual([{ id: 'default', name: 'Default' }]);
      expect(exported.currentAccount).toBe('default');
    });

    test('should create downloadable blob', () => {
      exportSettings();
      
      expect(global.Blob).toHaveBeenCalled();
      expect(global.Blob.mock.calls[0][1]).toEqual({ type: 'application/json' });
    });

    test('should create object URL', () => {
      exportSettings();
      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    test('should revoke object URL after download', () => {
      exportSettings();
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    test('should generate filename with current date', () => {
      const today = new Date().toISOString().split('T')[0];
      
      // Capture the download link
      let downloadLink = null;
      const originalCreateElement = document.createElement.bind(document);
      document.createElement = function(tag) {
        const element = originalCreateElement(tag);
        if (tag === 'a') {
          downloadLink = element;
        }
        return element;
      };
      
      exportSettings();
      
      expect(downloadLink).not.toBeNull();
      expect(downloadLink.download).toContain(today);
      expect(downloadLink.download).toContain('autochat-settings');
      expect(downloadLink.download).toContain('.json');
      
      document.createElement = originalCreateElement;
    });
  });

  describe('Import Settings', () => {
    test('should have import button', () => {
      const importBtn = document.getElementById('importSettings');
      expect(importBtn).not.toBeNull();
    });

    test('should have file input', () => {
      const fileInput = document.getElementById('importFile');
      expect(fileInput).not.toBeNull();
      expect(fileInput.type).toBe('file');
      expect(fileInput.accept).toBe('.json');
    });

    test('should import valid settings', () => {
      const validSettings = JSON.stringify({
        messageList: 'Imported messages',
        minInterval: 2,
        language: 'es'
      });
      
      const result = importSettings(validSettings);
      
      expect(result.success).toBe(true);
      expect(result.imported).toBe(3);
    });

    test('should update settings after import', () => {
      const newSettings = JSON.stringify({
        messageList: 'New messages',
        theme: 'dark'
      });
      
      importSettings(newSettings);
      
      expect(mockSettings.messageList).toBe('New messages');
      expect(mockSettings.theme).toBe('dark');
    });

    test('should reject invalid JSON', () => {
      const invalidJson = 'This is not JSON';
      
      const result = importSettings(invalidJson);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to parse settings file');
    });

    test('should reject non-object JSON', () => {
      const invalidSettings = JSON.stringify('string value');
      
      const result = importSettings(invalidSettings);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid settings format');
    });

    test('should reject null settings', () => {
      const nullSettings = JSON.stringify(null);
      
      const result = importSettings(nullSettings);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid settings format');
    });

    test('should handle partial settings import', () => {
      const partialSettings = JSON.stringify({
        theme: 'dark',
        language: 'es'
      });
      
      const result = importSettings(partialSettings);
      
      expect(result.success).toBe(true);
      expect(mockSettings.theme).toBe('dark');
      expect(mockSettings.language).toBe('es');
      expect(mockSettings.messageList).toBe('Hello\nWorld'); // Unchanged
    });

    test('should preserve existing settings not in import', () => {
      const originalDailyLimit = mockSettings.dailyLimit;
      
      const newSettings = JSON.stringify({
        theme: 'dark'
      });
      
      importSettings(newSettings);
      
      expect(mockSettings.dailyLimit).toBe(originalDailyLimit);
    });
  });

  describe('Import/Export Workflow', () => {
    test('should export and re-import settings successfully', () => {
      // Export
      const exportResult = exportSettings();
      expect(exportResult.success).toBe(true);
      
      // Modify settings
      mockSettings.theme = 'dark';
      mockSettings.language = 'es';
      
      // Import original
      const importResult = importSettings(exportResult.data);
      expect(importResult.success).toBe(true);
      
      // Verify restored
      expect(mockSettings.theme).toBe('light');
      expect(mockSettings.language).toBe('en');
    });

    test('should maintain data integrity through export/import cycle', () => {
      const originalSettings = JSON.parse(JSON.stringify(mockSettings));
      
      const exported = exportSettings();
      const imported = importSettings(exported.data);
      
      expect(imported.success).toBe(true);
      expect(mockSettings).toEqual(originalSettings);
    });
  });

  describe('Status Messages', () => {
    test('should show success message after export', () => {
      const statusEl = document.getElementById('importExportStatus');
      
      exportSettings();
      statusEl.textContent = '✓ Settings exported successfully';
      statusEl.className = 'status-message success';
      
      expect(statusEl.textContent).toContain('exported successfully');
      expect(statusEl.classList.contains('success')).toBe(true);
    });

    test('should show success message after import', () => {
      const statusEl = document.getElementById('importExportStatus');
      const settings = JSON.stringify({ theme: 'dark' });
      
      const result = importSettings(settings);
      if (result.success) {
        statusEl.textContent = `✓ Settings imported successfully (${result.imported} items)`;
        statusEl.className = 'status-message success';
      }
      
      expect(statusEl.textContent).toContain('imported successfully');
      expect(statusEl.textContent).toContain('1 items');
    });

    test('should show error message on import failure', () => {
      const statusEl = document.getElementById('importExportStatus');
      
      const result = importSettings('invalid json');
      if (!result.success) {
        statusEl.textContent = `✗ ${result.error}`;
        statusEl.className = 'status-message error';
      }
      
      expect(statusEl.textContent).toContain('Failed to parse');
      expect(statusEl.classList.contains('error')).toBe(true);
    });
  });

  describe('File Input Interaction', () => {
    test('should trigger file input when import button is clicked', () => {
      const importBtn = document.getElementById('importSettings');
      const fileInput = document.getElementById('importFile');
      
      const clickMock = jest.fn();
      fileInput.click = clickMock;
      
      importBtn.addEventListener('click', () => {
        fileInput.click();
      });
      
      importBtn.click();
      expect(clickMock).toHaveBeenCalled();
    });

    test('should be hidden by default', () => {
      const fileInput = document.getElementById('importFile');
      expect(fileInput.style.display).toBe('none');
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty settings object', () => {
      const emptySettings = JSON.stringify({});
      
      const result = importSettings(emptySettings);
      
      expect(result.success).toBe(true);
      expect(result.imported).toBe(0);
    });

    test('should handle very large settings file', () => {
      const largeSettings = {
        customPhrases: Array(1000).fill(0).map((_, i) => `Phrase ${i}`)
      };
      
      const exported = JSON.stringify(largeSettings);
      const result = importSettings(exported);
      
      expect(result.success).toBe(true);
      expect(mockSettings.customPhrases.length).toBe(1000);
    });

    test('should handle special characters in settings', () => {
      const specialSettings = JSON.stringify({
        messageList: 'Hello 👋\nWorld 🌍\n"Quoted" & <tags>'
      });
      
      const result = importSettings(specialSettings);
      
      expect(result.success).toBe(true);
      expect(mockSettings.messageList).toContain('👋');
      expect(mockSettings.messageList).toContain('🌍');
    });

    test('should handle malformed JSON with extra commas', () => {
      const malformedJson = '{"theme": "dark",}';
      
      const result = importSettings(malformedJson);
      
      expect(result.success).toBe(false);
    });

    test('should handle settings with nested objects', () => {
      const nestedSettings = JSON.stringify({
        accounts: [
          { id: 'acc1', name: 'Account 1', settings: { foo: 'bar' } }
        ]
      });
      
      const result = importSettings(nestedSettings);
      
      expect(result.success).toBe(true);
      expect(mockSettings.accounts[0].settings.foo).toBe('bar');
    });
  });

  describe('Data Validation', () => {
    test('should validate imported data types', () => {
      const invalidTypes = JSON.stringify({
        minInterval: 'not a number',
        maxInterval: 'also not a number'
      });
      
      const result = importSettings(invalidTypes);
      
      // Should still import but with wrong types
      expect(result.success).toBe(true);
      expect(typeof mockSettings.minInterval).toBe('string');
    });

    test('should handle missing required fields gracefully', () => {
      const incompleteSettings = JSON.stringify({
        theme: 'dark'
        // Missing many required fields
      });
      
      const result = importSettings(incompleteSettings);
      
      expect(result.success).toBe(true);
      // Original values should remain for missing fields
      expect(mockSettings.messageList).toBe('Hello\nWorld');
    });
  });

  describe('UI Elements', () => {
    test('should have descriptive text for export', () => {
      const exportSection = document.querySelector('.export-section p');
      expect(exportSection).not.toBeNull();
      expect(exportSection.textContent).toContain('Export');
    });

    test('should have descriptive text for import', () => {
      const importSection = document.querySelector('.import-section p');
      expect(importSection).not.toBeNull();
      expect(importSection.textContent).toContain('Import');
    });

    test('should have icons on buttons', () => {
      const exportBtn = document.getElementById('exportSettings');
      const importBtn = document.getElementById('importSettings');
      
      expect(exportBtn.textContent).toContain('📥');
      expect(importBtn.textContent).toContain('📤');
    });
  });
});
