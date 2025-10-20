/**
 * Phrase Categories & Tags System
 * Organize messages by category and tags
 */

export class CategoryManager {
  constructor() {
    this.categories = [];
    this.phrases = new Map(); // phraseId -> phrase object
    this.tags = new Set();
    this.loadFromStorage();
  }

  /**
   * Load categories and phrases from storage
   */
  async loadFromStorage() {
    const data = await chrome.storage.local.get(['categories', 'categorizedPhrases', 'phraseTags']);
    
    this.categories = data.categories || this.getDefaultCategories();
    this.phrases = new Map(data.categorizedPhrases || []);
    this.tags = new Set(data.phraseTags || []);
  }

  /**
   * Save to storage
   */
  async saveToStorage() {
    await chrome.storage.local.set({
      categories: this.categories,
      categorizedPhrases: Array.from(this.phrases.entries()),
      phraseTags: Array.from(this.tags)
    });
  }

  /**
   * Get default categories
   * @returns {Array<object>} Default categories
   */
  getDefaultCategories() {
    return [
      { id: 'greetings', name: 'Greetings', icon: '👋', color: '#667eea' },
      { id: 'questions', name: 'Questions', icon: '❓', color: '#f093fb' },
      { id: 'responses', name: 'Responses', icon: '💬', color: '#4facfe' },
      { id: 'closings', name: 'Closings', icon: '👋', color: '#43e97b' },
      { id: 'casual', name: 'Casual', icon: '😊', color: '#fa709a' },
      { id: 'formal', name: 'Formal', icon: '🎩', color: '#667eea' },
      { id: 'funny', name: 'Funny', icon: '😄', color: '#feca57' },
      { id: 'supportive', name: 'Supportive', icon: '💪', color: '#48dbfb' },
      { id: 'business', name: 'Business', icon: '💼', color: '#341f97' },
      { id: 'personal', name: 'Personal', icon: '❤️', color: '#ee5a6f' }
    ];
  }

  /**
   * Add a new category
   * @param {object} category - Category object
   * @returns {string} Category ID
   */
  addCategory(category) {
    const id = category.id || this.generateId();
    const newCategory = {
      id,
      name: category.name,
      icon: category.icon || '📁',
      color: category.color || '#667eea',
      description: category.description || '',
      created: new Date().toISOString()
    };

    this.categories.push(newCategory);
    this.saveToStorage();
    return id;
  }

  /**
   * Update a category
   * @param {string} categoryId - Category ID
   * @param {object} updates - Updated fields
   */
  updateCategory(categoryId, updates) {
    const index = this.categories.findIndex(c => c.id === categoryId);
    if (index !== -1) {
      this.categories[index] = { ...this.categories[index], ...updates };
      this.saveToStorage();
    }
  }

  /**
   * Delete a category
   * @param {string} categoryId - Category ID
   */
  deleteCategory(categoryId) {
    this.categories = this.categories.filter(c => c.id !== categoryId);
    
    // Remove category from phrases
    this.phrases.forEach((phrase, id) => {
      if (phrase.category === categoryId) {
        phrase.category = 'uncategorized';
      }
    });
    
    this.saveToStorage();
  }

  /**
   * Add a phrase
   * @param {string} text - Phrase text
   * @param {string} categoryId - Category ID
   * @param {Array<string>} tags - Tags
   * @returns {string} Phrase ID
   */
  addPhrase(text, categoryId = 'uncategorized', tags = []) {
    const id = this.generateId();
    const phrase = {
      id,
      text,
      category: categoryId,
      tags: tags,
      created: new Date().toISOString(),
      usageCount: 0,
      lastUsed: null,
      favorite: false
    };

    this.phrases.set(id, phrase);
    
    // Add tags to global tags set
    tags.forEach(tag => this.tags.add(tag));
    
    this.saveToStorage();
    return id;
  }

  /**
   * Update a phrase
   * @param {string} phraseId - Phrase ID
   * @param {object} updates - Updated fields
   */
  updatePhrase(phraseId, updates) {
    const phrase = this.phrases.get(phraseId);
    if (phrase) {
      this.phrases.set(phraseId, { ...phrase, ...updates });
      
      // Update tags
      if (updates.tags) {
        updates.tags.forEach(tag => this.tags.add(tag));
      }
      
      this.saveToStorage();
    }
  }

  /**
   * Delete a phrase
   * @param {string} phraseId - Phrase ID
   */
  deletePhrase(phraseId) {
    this.phrases.delete(phraseId);
    this.saveToStorage();
  }

  /**
   * Mark phrase as used
   * @param {string} phraseId - Phrase ID
   */
  markUsed(phraseId) {
    const phrase = this.phrases.get(phraseId);
    if (phrase) {
      phrase.usageCount++;
      phrase.lastUsed = new Date().toISOString();
      this.saveToStorage();
    }
  }

  /**
   * Toggle favorite status
   * @param {string} phraseId - Phrase ID
   */
  toggleFavorite(phraseId) {
    const phrase = this.phrases.get(phraseId);
    if (phrase) {
      phrase.favorite = !phrase.favorite;
      this.saveToStorage();
    }
  }

  /**
   * Get phrases by category
   * @param {string} categoryId - Category ID
   * @returns {Array<object>} Phrases
   */
  getPhrasesByCategory(categoryId) {
    return Array.from(this.phrases.values())
      .filter(p => p.category === categoryId);
  }

  /**
   * Get phrases by tag
   * @param {string} tag - Tag
   * @returns {Array<object>} Phrases
   */
  getPhrasesByTag(tag) {
    return Array.from(this.phrases.values())
      .filter(p => p.tags.includes(tag));
  }

  /**
   * Search phrases
   * @param {string} query - Search query
   * @returns {Array<object>} Matching phrases
   */
  searchPhrases(query) {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.phrases.values())
      .filter(p => 
        p.text.toLowerCase().includes(lowerQuery) ||
        p.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
  }

  /**
   * Get favorite phrases
   * @returns {Array<object>} Favorite phrases
   */
  getFavorites() {
    return Array.from(this.phrases.values())
      .filter(p => p.favorite);
  }

  /**
   * Get most used phrases
   * @param {number} limit - Max number of phrases
   * @returns {Array<object>} Most used phrases
   */
  getMostUsed(limit = 10) {
    return Array.from(this.phrases.values())
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  }

  /**
   * Get recently used phrases
   * @param {number} limit - Max number of phrases
   * @returns {Array<object>} Recently used phrases
   */
  getRecentlyUsed(limit = 10) {
    return Array.from(this.phrases.values())
      .filter(p => p.lastUsed)
      .sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed))
      .slice(0, limit);
  }

  /**
   * Get all categories
   * @returns {Array<object>} Categories
   */
  getCategories() {
    return this.categories;
  }

  /**
   * Get all tags
   * @returns {Array<string>} Tags
   */
  getTags() {
    return Array.from(this.tags).sort();
  }

  /**
   * Get category statistics
   * @returns {Array<object>} Stats per category
   */
  getCategoryStats() {
    return this.categories.map(category => {
      const phrases = this.getPhrasesByCategory(category.id);
      const totalUsage = phrases.reduce((sum, p) => sum + p.usageCount, 0);
      
      return {
        ...category,
        phraseCount: phrases.length,
        totalUsage,
        avgUsage: phrases.length > 0 ? Math.round(totalUsage / phrases.length) : 0
      };
    });
  }

  /**
   * Get tag statistics
   * @returns {Array<object>} Stats per tag
   */
  getTagStats() {
    const stats = {};
    
    this.phrases.forEach(phrase => {
      phrase.tags.forEach(tag => {
        if (!stats[tag]) {
          stats[tag] = { tag, count: 0, usage: 0 };
        }
        stats[tag].count++;
        stats[tag].usage += phrase.usageCount;
      });
    });

    return Object.values(stats).sort((a, b) => b.count - a.count);
  }

  /**
   * Import phrases from array
   * @param {Array<object>} phrases - Phrases to import
   * @param {string} defaultCategory - Default category
   */
  importPhrases(phrases, defaultCategory = 'uncategorized') {
    phrases.forEach(phrase => {
      if (typeof phrase === 'string') {
        this.addPhrase(phrase, defaultCategory, []);
      } else {
        this.addPhrase(
          phrase.text || phrase.message || phrase,
          phrase.category || defaultCategory,
          phrase.tags || []
        );
      }
    });
  }

  /**
   * Export phrases by category
   * @param {string} categoryId - Category ID (or 'all')
   * @returns {object} Export data
   */
  exportPhrases(categoryId = 'all') {
    const phrases = categoryId === 'all' 
      ? Array.from(this.phrases.values())
      : this.getPhrasesByCategory(categoryId);

    return {
      exported: new Date().toISOString(),
      category: categoryId,
      count: phrases.length,
      phrases: phrases.map(p => ({
        text: p.text,
        category: p.category,
        tags: p.tags,
        usageCount: p.usageCount
      }))
    };
  }

  /**
   * Generate unique ID
   * @returns {string} Unique ID
   */
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Suggest tags for a phrase
   * @param {string} text - Phrase text
   * @returns {Array<string>} Suggested tags
   */
  suggestTags(text) {
    const suggestions = [];
    const lower = text.toLowerCase();

    // Common patterns
    if (lower.match(/\?$/)) suggestions.push('question');
    if (lower.match(/^(hi|hello|hey)/)) suggestions.push('greeting');
    if (lower.match(/^(bye|goodbye|see you)/)) suggestions.push('closing');
    if (lower.match(/😊|😄|😁|🤣/)) suggestions.push('happy');
    if (lower.match(/thank/)) suggestions.push('gratitude');
    if (lower.match(/sorry|apologize/)) suggestions.push('apology');
    if (lower.length < 20) suggestions.push('short');
    if (lower.length > 100) suggestions.push('long');

    return suggestions;
  }
}

// Singleton instance
export const categories = new CategoryManager();
