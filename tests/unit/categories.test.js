/**
 * Tests for Categories Module
 */

describe('CategoryManager', () => {
  let CategoryManager;
  let manager;

  beforeEach(() => {
    // Create inline class for testing
    CategoryManager = class {
      constructor() {
        this.categories = this.getDefaultCategories();
        this.phrases = new Map();
        this.tags = new Set();
      }

      getDefaultCategories() {
        return [
          { id: 'greetings', name: 'Greetings', icon: '👋', color: '#667eea' },
          { id: 'questions', name: 'Questions', icon: '❓', color: '#f093fb' }
        ];
      }

      generateId() {
        return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }

      addCategory(category) {
        const id = category.id || this.generateId();
        const newCategory = {
          id,
          name: category.name,
          icon: category.icon || '📁',
          color: category.color || '#667eea',
          created: new Date().toISOString()
        };
        this.categories.push(newCategory);
        return id;
      }

      addPhrase(text, categoryId = 'uncategorized', tags = []) {
        const id = this.generateId();
        const phrase = {
          id,
          text,
          category: categoryId,
          tags,
          created: new Date().toISOString(),
          usageCount: 0,
          lastUsed: null,
          favorite: false
        };
        
        this.phrases.set(id, phrase);
        tags.forEach(tag => this.tags.add(tag));
        return id;
      }

      updatePhrase(phraseId, updates) {
        const phrase = this.phrases.get(phraseId);
        if (phrase) {
          this.phrases.set(phraseId, { ...phrase, ...updates });
          if (updates.tags) {
            updates.tags.forEach(tag => this.tags.add(tag));
          }
        }
      }

      deletePhrase(phraseId) {
        this.phrases.delete(phraseId);
      }

      getPhrasesByCategory(categoryId) {
        return Array.from(this.phrases.values())
          .filter(p => p.category === categoryId);
      }

      getPhrasesByTag(tag) {
        return Array.from(this.phrases.values())
          .filter(p => p.tags.includes(tag));
      }

      searchPhrases(query) {
        const lowerQuery = query.toLowerCase();
        return Array.from(this.phrases.values())
          .filter(p => 
            p.text.toLowerCase().includes(lowerQuery) ||
            p.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
          );
      }

      toggleFavorite(phraseId) {
        const phrase = this.phrases.get(phraseId);
        if (phrase) {
          phrase.favorite = !phrase.favorite;
        }
      }

      markUsed(phraseId) {
        const phrase = this.phrases.get(phraseId);
        if (phrase) {
          phrase.usageCount++;
          phrase.lastUsed = new Date().toISOString();
        }
      }

      getMostUsed(limit = 10) {
        return Array.from(this.phrases.values())
          .sort((a, b) => b.usageCount - a.usageCount)
          .slice(0, limit);
      }

      getCategories() {
        return this.categories;
      }

      getTags() {
        return Array.from(this.tags).sort();
      }
    };

    manager = new CategoryManager();
  });

  test('should initialize with default categories', () => {
    const categories = manager.getCategories();
    expect(categories).toHaveLength(2);
    expect(categories[0].name).toBe('Greetings');
    expect(categories[1].name).toBe('Questions');
  });

  test('should add a new category', () => {
    const id = manager.addCategory({
      name: 'Custom',
      icon: '🎯',
      color: '#ff0000'
    });
    
    expect(id).toBeDefined();
    const categories = manager.getCategories();
    expect(categories).toHaveLength(3);
    
    const newCategory = categories.find(c => c.id === id);
    expect(newCategory.name).toBe('Custom');
    expect(newCategory.icon).toBe('🎯');
  });

  test('should add a phrase with category and tags', () => {
    const phraseId = manager.addPhrase(
      'Hello, how are you?',
      'greetings',
      ['friendly', 'casual']
    );
    
    expect(phraseId).toBeDefined();
    
    const phrases = manager.getPhrasesByCategory('greetings');
    expect(phrases).toHaveLength(1);
    expect(phrases[0].text).toBe('Hello, how are you?');
    expect(phrases[0].tags).toEqual(['friendly', 'casual']);
  });

  test('should update a phrase', () => {
    const id = manager.addPhrase('Original text', 'greetings', ['old']);
    
    manager.updatePhrase(id, {
      text: 'Updated text',
      tags: ['new']
    });
    
    const phrases = Array.from(manager.phrases.values());
    const updated = phrases.find(p => p.id === id);
    expect(updated.text).toBe('Updated text');
    expect(updated.tags).toEqual(['new']);
  });

  test('should delete a phrase', () => {
    const id = manager.addPhrase('Test', 'greetings', []);
    expect(manager.phrases.size).toBe(1);
    
    manager.deletePhrase(id);
    expect(manager.phrases.size).toBe(0);
  });

  test('should get phrases by category', () => {
    manager.addPhrase('Hi', 'greetings', []);
    manager.addPhrase('Hello', 'greetings', []);
    manager.addPhrase('Why?', 'questions', []);
    
    const greetings = manager.getPhrasesByCategory('greetings');
    const questions = manager.getPhrasesByCategory('questions');
    
    expect(greetings).toHaveLength(2);
    expect(questions).toHaveLength(1);
  });

  test('should get phrases by tag', () => {
    manager.addPhrase('Phrase 1', 'greetings', ['friendly']);
    manager.addPhrase('Phrase 2', 'greetings', ['friendly', 'casual']);
    manager.addPhrase('Phrase 3', 'questions', ['formal']);
    
    const friendly = manager.getPhrasesByTag('friendly');
    expect(friendly).toHaveLength(2);
  });

  test('should search phrases by text', () => {
    manager.addPhrase('Hello world', 'greetings', []);
    manager.addPhrase('Goodbye world', 'greetings', []);
    manager.addPhrase('Hi there', 'greetings', []);
    
    const results = manager.searchPhrases('world');
    expect(results).toHaveLength(2);
  });

  test('should search phrases by tag', () => {
    manager.addPhrase('Message 1', 'greetings', ['friendly']);
    manager.addPhrase('Message 2', 'greetings', ['formal']);
    
    const results = manager.searchPhrases('friendly');
    expect(results).toHaveLength(1);
    expect(results[0].text).toBe('Message 1');
  });

  test('should toggle favorite status', () => {
    const id = manager.addPhrase('Test', 'greetings', []);
    
    const phrase = manager.phrases.get(id);
    expect(phrase.favorite).toBe(false);
    
    manager.toggleFavorite(id);
    expect(phrase.favorite).toBe(true);
    
    manager.toggleFavorite(id);
    expect(phrase.favorite).toBe(false);
  });

  test('should track usage count', () => {
    const id = manager.addPhrase('Test', 'greetings', []);
    
    const phrase = manager.phrases.get(id);
    expect(phrase.usageCount).toBe(0);
    
    manager.markUsed(id);
    expect(phrase.usageCount).toBe(1);
    expect(phrase.lastUsed).toBeDefined();
    
    manager.markUsed(id);
    expect(phrase.usageCount).toBe(2);
  });

  test('should get most used phrases', () => {
    const id1 = manager.addPhrase('Phrase 1', 'greetings', []);
    const id2 = manager.addPhrase('Phrase 2', 'greetings', []);
    const id3 = manager.addPhrase('Phrase 3', 'greetings', []);
    
    manager.markUsed(id1);
    manager.markUsed(id2);
    manager.markUsed(id2);
    manager.markUsed(id3);
    manager.markUsed(id3);
    manager.markUsed(id3);
    
    const mostUsed = manager.getMostUsed(3);
    expect(mostUsed).toHaveLength(3);
    expect(mostUsed[0].text).toBe('Phrase 3'); // 3 uses
    expect(mostUsed[1].text).toBe('Phrase 2'); // 2 uses
    expect(mostUsed[2].text).toBe('Phrase 1'); // 1 use
  });

  test('should track all tags', () => {
    manager.addPhrase('P1', 'greetings', ['tag1', 'tag2']);
    manager.addPhrase('P2', 'greetings', ['tag2', 'tag3']);
    
    const tags = manager.getTags();
    expect(tags).toEqual(['tag1', 'tag2', 'tag3']);
  });
});
