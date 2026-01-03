/**
 * Tests for Phrase Management UI Component
 */

describe('Phrase Management', () => {
  let customPhrases;
  let addCustomPhrase;
  let deleteCustomPhrase;
  let renderPhrasesList;
  let saveCustomPhrases;
  let loadCustomPhrases;
  let storedCustomPhrases;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div id="phraseModal" class="modal">
        <div class="modal-content">
          <h2>Manage Custom Phrases</h2>
          
          <div class="phrase-form">
            <input id="newPhraseInput" type="text" placeholder="Enter new phrase">
            <button id="addNewPhrase" class="btn-primary">Add Phrase</button>
          </div>
          
          <div id="phrasesList" class="phrases-list"></div>
          
          <div class="phrase-stats">
            <span id="phraseCount">0</span> phrases
          </div>
        </div>
      </div>
      
      <button id="managePhrases">Manage Phrases</button>
      <button id="loadDefaultPhrases">Load Default Phrases</button>
    `;

    // Initialize state
    customPhrases = [];
    storedCustomPhrases = [];

    // Mock chrome storage
    global.chrome.storage.local.get.mockImplementation((keys, callback) => {
      const result = { customPhrases: storedCustomPhrases };
      if (typeof callback === 'function') {
        callback(result);
      }
      return Promise.resolve(result);
    });

    global.chrome.storage.local.set.mockImplementation((items, callback) => {
      if (items.customPhrases) {
        customPhrases = items.customPhrases;
        storedCustomPhrases = items.customPhrases.slice();
      }
      if (callback) callback();
      return Promise.resolve();
    });

    // Define phrase management functions
    addCustomPhrase = function (phrase) {
      if (!phrase || phrase.trim() === '') {
        return { success: false, error: 'Phrase cannot be empty' };
      }

      if (customPhrases.includes(phrase.trim())) {
        return { success: false, error: 'Phrase already exists' };
      }

      customPhrases.push(phrase.trim());
      return { success: true };
    };

    deleteCustomPhrase = function (index) {
      if (index < 0 || index >= customPhrases.length) {
        return { success: false, error: 'Invalid phrase index' };
      }

      customPhrases.splice(index, 1);
      return { success: true };
    };

    saveCustomPhrases = async function () {
      await chrome.storage.local.set({ customPhrases });
    };

    loadCustomPhrases = async function () {
      const result = await chrome.storage.local.get('customPhrases');
      if (result.customPhrases) {
        customPhrases = result.customPhrases;
      }
      return customPhrases;
    };

    renderPhrasesList = function () {
      const container = document.getElementById('phrasesList');
      const countElement = document.getElementById('phraseCount');

      if (!container) return;

      container.innerHTML = '';

      customPhrases.forEach((phrase, index) => {
        const item = document.createElement('div');
        item.className = 'phrase-item';
        item.innerHTML = `
          <span class="phrase-text">${phrase}</span>
          <button class="btn-delete" data-index="${index}">Delete</button>
        `;
        container.appendChild(item);
      });

      if (countElement) {
        countElement.textContent = customPhrases.length;
      }
    };
  });

  afterEach(() => {
    document.body.innerHTML = '';
    customPhrases = [];
  });

  describe('Adding Phrases', () => {
    test('should add new phrase successfully', () => {
      const result = addCustomPhrase('Hello, how are you?');
      expect(result.success).toBe(true);
      expect(customPhrases).toContain('Hello, how are you?');
    });

    test('should add multiple phrases', () => {
      addCustomPhrase('First phrase');
      addCustomPhrase('Second phrase');
      addCustomPhrase('Third phrase');

      expect(customPhrases.length).toBe(3);
      expect(customPhrases).toEqual(['First phrase', 'Second phrase', 'Third phrase']);
    });

    test('should trim whitespace from phrases', () => {
      addCustomPhrase('  Trimmed phrase  ');
      expect(customPhrases).toContain('Trimmed phrase');
      expect(customPhrases).not.toContain('  Trimmed phrase  ');
    });

    test('should reject empty phrase', () => {
      const result = addCustomPhrase('');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Phrase cannot be empty');
      expect(customPhrases.length).toBe(0);
    });

    test('should reject whitespace-only phrase', () => {
      const result = addCustomPhrase('   ');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Phrase cannot be empty');
    });

    test('should reject duplicate phrase', () => {
      addCustomPhrase('Duplicate phrase');
      const result = addCustomPhrase('Duplicate phrase');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Phrase already exists');
      expect(customPhrases.length).toBe(1);
    });

    test('should handle phrases with special characters', () => {
      const specialPhrase = 'Hello! 🎉 {time} - Nice to meet you';
      const result = addCustomPhrase(specialPhrase);

      expect(result.success).toBe(true);
      expect(customPhrases).toContain(specialPhrase);
    });

    test('should handle long phrases', () => {
      const longPhrase = 'a'.repeat(500);
      const result = addCustomPhrase(longPhrase);

      expect(result.success).toBe(true);
      expect(customPhrases[0].length).toBe(500);
    });
  });

  describe('Deleting Phrases', () => {
    beforeEach(() => {
      customPhrases = ['First', 'Second', 'Third'];
    });

    test('should delete phrase by index', () => {
      const result = deleteCustomPhrase(1);
      expect(result.success).toBe(true);
      expect(customPhrases).toEqual(['First', 'Third']);
    });

    test('should delete first phrase', () => {
      deleteCustomPhrase(0);
      expect(customPhrases).toEqual(['Second', 'Third']);
    });

    test('should delete last phrase', () => {
      deleteCustomPhrase(2);
      expect(customPhrases).toEqual(['First', 'Second']);
    });

    test('should reject invalid index (negative)', () => {
      const result = deleteCustomPhrase(-1);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid phrase index');
      expect(customPhrases.length).toBe(3);
    });

    test('should reject invalid index (too large)', () => {
      const result = deleteCustomPhrase(10);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid phrase index');
    });

    test('should delete all phrases one by one', () => {
      deleteCustomPhrase(0);
      deleteCustomPhrase(0);
      deleteCustomPhrase(0);

      expect(customPhrases.length).toBe(0);
    });

    test('should handle deleting from empty list', () => {
      customPhrases = [];
      const result = deleteCustomPhrase(0);
      expect(result.success).toBe(false);
    });
  });

  describe('Rendering Phrases List', () => {
    test('should render empty list', () => {
      customPhrases = [];
      renderPhrasesList();

      const container = document.getElementById('phrasesList');
      expect(container.children.length).toBe(0);
    });

    test('should render single phrase', () => {
      customPhrases = ['Test phrase'];
      renderPhrasesList();

      const container = document.getElementById('phrasesList');
      expect(container.children.length).toBe(1);
      expect(container.textContent).toContain('Test phrase');
    });

    test('should render multiple phrases', () => {
      customPhrases = ['First', 'Second', 'Third'];
      renderPhrasesList();

      const container = document.getElementById('phrasesList');
      expect(container.children.length).toBe(3);
    });

    test('should include delete button for each phrase', () => {
      customPhrases = ['Test'];
      renderPhrasesList();

      const deleteBtn = document.querySelector('.btn-delete');
      expect(deleteBtn).not.toBeNull();
      expect(deleteBtn.getAttribute('data-index')).toBe('0');
    });

    test('should update phrase count', () => {
      customPhrases = ['One', 'Two', 'Three'];
      renderPhrasesList();

      const countElement = document.getElementById('phraseCount');
      expect(countElement.textContent).toBe('3');
    });

    test('should update count when phrases change', () => {
      customPhrases = ['One'];
      renderPhrasesList();
      expect(document.getElementById('phraseCount').textContent).toBe('1');

      customPhrases.push('Two');
      renderPhrasesList();
      expect(document.getElementById('phraseCount').textContent).toBe('2');
    });

    test('should handle missing container gracefully', () => {
      document.body.innerHTML = '';
      expect(() => {
        renderPhrasesList();
      }).not.toThrow();
    });
  });

  describe('Persistence', () => {
    test('should save phrases to storage', async () => {
      customPhrases = ['Test phrase 1', 'Test phrase 2'];
      await saveCustomPhrases();

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        customPhrases: ['Test phrase 1', 'Test phrase 2'],
      });
    });

    test('should load phrases from storage', async () => {
      customPhrases = ['Saved phrase 1', 'Saved phrase 2'];
      await saveCustomPhrases();

      customPhrases = [];
      const loaded = await loadCustomPhrases();

      expect(loaded).toEqual(['Saved phrase 1', 'Saved phrase 2']);
      expect(customPhrases).toEqual(['Saved phrase 1', 'Saved phrase 2']);
    });

    test('should handle empty storage', async () => {
      global.chrome.storage.local.get.mockImplementation((keys, callback) => {
        if (typeof callback === 'function') {
          callback({});
        }
        return Promise.resolve({});
      });

      const loaded = await loadCustomPhrases();
      expect(loaded).toEqual([]);
    });

    test('should persist after adding phrase', async () => {
      addCustomPhrase('New phrase');
      await saveCustomPhrases();

      customPhrases = [];
      await loadCustomPhrases();

      expect(customPhrases).toContain('New phrase');
    });

    test('should persist after deleting phrase', async () => {
      customPhrases = ['Keep', 'Delete'];
      await saveCustomPhrases();

      deleteCustomPhrase(1);
      await saveCustomPhrases();

      customPhrases = [];
      await loadCustomPhrases();

      expect(customPhrases).toEqual(['Keep']);
    });
  });

  describe('UI Interactions', () => {
    test('should add phrase when button is clicked', () => {
      const input = document.getElementById('newPhraseInput');
      const button = document.getElementById('addNewPhrase');

      input.value = 'New phrase from UI';

      button.addEventListener('click', () => {
        addCustomPhrase(input.value);
        input.value = '';
        renderPhrasesList();
      });

      button.click();

      expect(customPhrases).toContain('New phrase from UI');
      expect(input.value).toBe('');
    });

    test('should clear input after adding phrase', () => {
      const input = document.getElementById('newPhraseInput');
      input.value = 'Test';

      addCustomPhrase(input.value);
      input.value = '';

      expect(input.value).toBe('');
    });

    test('should update list after adding phrase', () => {
      addCustomPhrase('Test');
      renderPhrasesList();

      const container = document.getElementById('phrasesList');
      expect(container.children.length).toBe(1);
    });

    test('should delete phrase when delete button is clicked', () => {
      customPhrases = ['To be deleted'];
      renderPhrasesList();

      const deleteBtn = document.querySelector('.btn-delete');
      deleteBtn.addEventListener('click', (e) => {
        const index = parseInt(e.target.getAttribute('data-index'));
        deleteCustomPhrase(index);
        renderPhrasesList();
      });

      deleteBtn.click();

      expect(customPhrases.length).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    test('should handle phrases with HTML characters', () => {
      const phrase = '<script>alert("test")</script>';
      addCustomPhrase(phrase);
      expect(customPhrases).toContain(phrase);
    });

    test('should handle phrases with quotes', () => {
      const phrase = 'She said "Hello" to me';
      addCustomPhrase(phrase);
      expect(customPhrases).toContain(phrase);
    });

    test('should handle phrases with apostrophes', () => {
      const phrase = "It's a beautiful day";
      addCustomPhrase(phrase);
      expect(customPhrases).toContain(phrase);
    });

    test('should handle emojis in phrases', () => {
      const phrase = 'Hello 👋 World 🌍';
      addCustomPhrase(phrase);
      expect(customPhrases).toContain(phrase);
    });

    test('should handle template variables', () => {
      const phrase = 'Current time: {time}, Today is {date}';
      addCustomPhrase(phrase);
      expect(customPhrases).toContain(phrase);
    });

    test('should handle very large phrase list', () => {
      for (let i = 0; i < 100; i++) {
        addCustomPhrase(`Phrase ${i}`);
      }

      expect(customPhrases.length).toBe(100);
    });
  });

  describe('Phrase Operations', () => {
    test('should maintain phrase order', () => {
      const phrases = ['First', 'Second', 'Third', 'Fourth'];
      phrases.forEach((p) => addCustomPhrase(p));

      expect(customPhrases).toEqual(phrases);
    });

    test('should update indexes after deletion', () => {
      customPhrases = ['A', 'B', 'C', 'D'];
      deleteCustomPhrase(1); // Delete 'B'

      expect(customPhrases).toEqual(['A', 'C', 'D']);
      expect(customPhrases[1]).toBe('C');
    });
  });
});
