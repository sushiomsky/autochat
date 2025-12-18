/**
 * Emoji & GIF Picker
 * Quick access to emojis and GIFs
 */

export class EmojiPicker {
  constructor() {
    this.recentEmojis = [];
    this.maxRecent = 20;
    this.favorites = new Set();
    this.loadFromStorage();
  }

  /**
   * Load from storage
   */
  async loadFromStorage() {
    const data = await chrome.storage.local.get(['recentEmojis', 'favoriteEmojis']);
    this.recentEmojis = data.recentEmojis || [];
    this.favorites = new Set(data.favoriteEmojis || []);
  }

  /**
   * Save to storage
   */
  async saveToStorage() {
    await chrome.storage.local.set({
      recentEmojis: this.recentEmojis,
      favoriteEmojis: Array.from(this.favorites),
    });
  }

  /**
   * Get emoji categories
   * @returns {object} Emojis grouped by category
   */
  getCategories() {
    return {
      smileys: {
        name: 'Smileys & Emotion',
        icon: '😀',
        emojis: [
          '😀',
          '😃',
          '😄',
          '😁',
          '😆',
          '😅',
          '🤣',
          '😂',
          '🙂',
          '🙃',
          '😉',
          '😊',
          '😇',
          '🥰',
          '😍',
          '🤩',
          '😘',
          '😗',
          '😚',
          '😙',
          '😋',
          '😛',
          '😜',
          '🤪',
          '😝',
          '🤑',
          '🤗',
          '🤭',
          '🤫',
          '🤔',
          '🤐',
          '🤨',
          '😐',
          '😑',
          '😶',
          '😏',
          '😒',
          '🙄',
          '😬',
          '🤥',
          '😌',
          '😔',
          '😪',
          '🤤',
          '😴',
          '😷',
          '🤒',
          '🤕',
          '🤢',
          '🤮',
        ],
      },
      gestures: {
        name: 'Hand Gestures',
        icon: '👋',
        emojis: [
          '👋',
          '🤚',
          '🖐️',
          '✋',
          '🖖',
          '👌',
          '🤏',
          '✌️',
          '🤞',
          '🤟',
          '🤘',
          '🤙',
          '👈',
          '👉',
          '👆',
          '🖕',
          '👇',
          '☝️',
          '👍',
          '👎',
          '✊',
          '👊',
          '🤛',
          '🤜',
          '👏',
          '🙌',
          '👐',
          '🤲',
          '🤝',
          '🙏',
        ],
      },
      hearts: {
        name: 'Hearts & Symbols',
        icon: '❤️',
        emojis: [
          '❤️',
          '🧡',
          '💛',
          '💚',
          '💙',
          '💜',
          '🖤',
          '🤍',
          '🤎',
          '💔',
          '❣️',
          '💕',
          '💞',
          '💓',
          '💗',
          '💖',
          '💘',
          '💝',
          '💟',
          '☮️',
          '✝️',
          '☪️',
          '🕉️',
          '☸️',
          '✡️',
          '🔯',
          '🕎',
          '☯️',
          '☦️',
          '🛐',
        ],
      },
      animals: {
        name: 'Animals & Nature',
        icon: '🐶',
        emojis: [
          '🐶',
          '🐱',
          '🐭',
          '🐹',
          '🐰',
          '🦊',
          '🐻',
          '🐼',
          '🐨',
          '🐯',
          '🦁',
          '🐮',
          '🐷',
          '🐸',
          '🐵',
          '🐔',
          '🐧',
          '🐦',
          '🐤',
          '🦆',
          '🦅',
          '🦉',
          '🦇',
          '🐺',
          '🐗',
          '🐴',
          '🦄',
          '🐝',
          '🐛',
          '🦋',
        ],
      },
      food: {
        name: 'Food & Drink',
        icon: '🍔',
        emojis: [
          '🍔',
          '🍕',
          '🌭',
          '🥪',
          '🌮',
          '🌯',
          '🥙',
          '🥚',
          '🍳',
          '🥘',
          '🍲',
          '🥗',
          '🍿',
          '🧈',
          '🧂',
          '🥫',
          '🍱',
          '🍘',
          '🍙',
          '🍚',
          '🍛',
          '🍜',
          '🍝',
          '🍠',
          '🍢',
          '🍣',
          '🍤',
          '🍥',
          '🥮',
          '🍡',
        ],
      },
      activities: {
        name: 'Activities & Sports',
        icon: '⚽',
        emojis: [
          '⚽',
          '🏀',
          '🏈',
          '⚾',
          '🥎',
          '🎾',
          '🏐',
          '🏉',
          '🥏',
          '🎱',
          '🪀',
          '🏓',
          '🏸',
          '🏒',
          '🏑',
          '🥍',
          '🏏',
          '🥅',
          '⛳',
          '🪁',
          '🏹',
          '🎣',
          '🤿',
          '🥊',
          '🥋',
          '🎽',
          '🛹',
          '🛼',
          '🛷',
          '⛸️',
        ],
      },
      travel: {
        name: 'Travel & Places',
        icon: '✈️',
        emojis: [
          '🚗',
          '🚕',
          '🚙',
          '🚌',
          '🚎',
          '🏎️',
          '🚓',
          '🚑',
          '🚒',
          '🚐',
          '🚚',
          '🚛',
          '🚜',
          '🦯',
          '🦽',
          '🦼',
          '🛴',
          '🚲',
          '🛵',
          '🏍️',
          '🛺',
          '🚨',
          '🚔',
          '🚍',
          '🚘',
          '🚖',
          '🚡',
          '🚠',
          '🚟',
          '🚃',
        ],
      },
      objects: {
        name: 'Objects',
        icon: '💡',
        emojis: [
          '⌚',
          '📱',
          '📲',
          '💻',
          '⌨️',
          '🖥️',
          '🖨️',
          '🖱️',
          '🖲️',
          '🕹️',
          '🗜️',
          '💽',
          '💾',
          '💿',
          '📀',
          '📼',
          '📷',
          '📸',
          '📹',
          '🎥',
          '📽️',
          '🎞️',
          '📞',
          '☎️',
          '📟',
          '📠',
          '📺',
          '📻',
          '🎙️',
          '🎚️',
        ],
      },
      symbols: {
        name: 'Symbols',
        icon: '⚠️',
        emojis: [
          '❤️',
          '💔',
          '❣️',
          '💕',
          '💞',
          '💓',
          '💗',
          '💖',
          '💘',
          '💝',
          '💟',
          '☮️',
          '✝️',
          '☪️',
          '🕉️',
          '☸️',
          '✡️',
          '🔯',
          '🕎',
          '☯️',
          '☦️',
          '🛐',
          '⛎',
          '♈',
          '♉',
          '♊',
          '♋',
          '♌',
          '♍',
          '♎',
        ],
      },
      flags: {
        name: 'Flags',
        icon: '🏁',
        emojis: [
          '🏁',
          '🚩',
          '🎌',
          '🏴',
          '🏳️',
          '🏳️‍🌈',
          '🏳️‍⚧️',
          '🏴‍☠️',
          '🇺🇸',
          '🇬🇧',
          '🇨🇦',
          '🇦🇺',
          '🇩🇪',
          '🇫🇷',
          '🇮🇹',
          '🇪🇸',
          '🇵🇹',
          '🇧🇷',
          '🇲🇽',
          '🇯🇵',
          '🇰🇷',
          '🇨🇳',
          '🇮🇳',
          '🇷🇺',
        ],
      },
    };
  }

  /**
   * Search emojis
   * @param {string} query - Search query
   * @returns {Array<string>} Matching emojis
   */
  search(query) {
    const keywords = {
      happy: ['😀', '😃', '😄', '😁', '😊', '😍', '🥰', '😎'],
      sad: ['😢', '😭', '😿', '☹️', '🙁', '😞', '😔', '😟'],
      love: ['❤️', '💕', '💖', '💗', '💘', '💝', '💞', '💓'],
      laugh: ['😂', '🤣', '😆', '😹'],
      angry: ['😠', '😡', '🤬', '😤'],
      cool: ['😎', '🕶️', '😏'],
      thumbs: ['👍', '👎', '👌'],
      hands: ['👋', '🙌', '👏', '🤝', '🙏'],
      fire: ['🔥', '💥', '⚡'],
      star: ['⭐', '🌟', '✨', '💫'],
      heart: ['❤️', '💜', '💙', '💚', '💛', '🧡'],
    };

    const lowerQuery = query.toLowerCase();
    const matches = [];

    // Check keywords
    Object.entries(keywords).forEach(([keyword, emojis]) => {
      if (keyword.includes(lowerQuery)) {
        matches.push(...emojis);
      }
    });

    return [...new Set(matches)]; // Remove duplicates
  }

  /**
   * Add emoji to recent
   * @param {string} emoji - Emoji character
   */
  addToRecent(emoji) {
    // Remove if already in recent
    this.recentEmojis = this.recentEmojis.filter((e) => e !== emoji);

    // Add to beginning
    this.recentEmojis.unshift(emoji);

    // Keep only maxRecent
    if (this.recentEmojis.length > this.maxRecent) {
      this.recentEmojis.pop();
    }

    this.saveToStorage();
  }

  /**
   * Toggle favorite
   * @param {string} emoji - Emoji character
   */
  toggleFavorite(emoji) {
    if (this.favorites.has(emoji)) {
      this.favorites.delete(emoji);
    } else {
      this.favorites.add(emoji);
    }
    this.saveToStorage();
  }

  /**
   * Get recent emojis
   * @returns {Array<string>} Recent emojis
   */
  getRecent() {
    return this.recentEmojis;
  }

  /**
   * Get favorite emojis
   * @returns {Array<string>} Favorite emojis
   */
  getFavorites() {
    return Array.from(this.favorites);
  }

  /**
   * Get random emoji
   * @param {string} category - Category name (optional)
   * @returns {string} Random emoji
   */
  getRandom(category = null) {
    const categories = this.getCategories();

    if (category && categories[category]) {
      const emojis = categories[category].emojis;
      return emojis[Math.floor(Math.random() * emojis.length)];
    }

    // Get from all categories
    const allEmojis = Object.values(categories).flatMap((cat) => cat.emojis);
    return allEmojis[Math.floor(Math.random() * allEmojis.length)];
  }

  /**
   * Get skin tone variations
   * @param {string} emoji - Base emoji
   * @returns {Array<string>} Skin tone variations
   */
  getSkinTones(emoji) {
    const skinTones = ['🏻', '🏼', '🏽', '🏾', '🏿'];
    const variations = [emoji];

    // Try to add skin tone modifiers
    skinTones.forEach((tone) => {
      variations.push(emoji + tone);
    });

    return variations;
  }
}

/**
 * GIF Picker (uses Giphy API)
 */
export class GifPicker {
  constructor() {
    this.apiKey = 'YOUR_GIPHY_API_KEY'; // Replace with actual key or use public beta key
    this.recentGifs = [];
    this.maxRecent = 10;
    this.loadFromStorage();
  }

  /**
   * Load from storage
   */
  async loadFromStorage() {
    const data = await chrome.storage.local.get(['recentGifs']);
    this.recentGifs = data.recentGifs || [];
  }

  /**
   * Save to storage
   */
  async saveToStorage() {
    await chrome.storage.local.set({ recentGifs: this.recentGifs });
  }

  /**
   * Search GIFs via Giphy
   * @param {string} query - Search query
   * @param {number} limit - Number of results
   * @returns {Promise<Array>} GIF results
   */
  async search(query, _limit = 20) {
    // Note: This requires a Giphy API key
    // For demo purposes, return mock data
    return this.getMockGifs(query);
  }

  /**
   * Get trending GIFs
   * @param {number} limit - Number of results
   * @returns {Promise<Array>} GIF results
   */
  async getTrending(_limit = 20) {
    return this.getMockGifs('trending');
  }

  /**
   * Get mock GIFs (placeholder)
   * @param {string} category - Category
   * @returns {Array} Mock GIF data
   */
  getMockGifs(category) {
    // Placeholder - in production, this would call Giphy API
    return [
      { id: '1', title: `${category} GIF 1`, url: 'https://via.placeholder.com/200' },
      { id: '2', title: `${category} GIF 2`, url: 'https://via.placeholder.com/200' },
      { id: '3', title: `${category} GIF 3`, url: 'https://via.placeholder.com/200' },
    ];
  }

  /**
   * Add GIF to recent
   * @param {object} gif - GIF object
   */
  addToRecent(gif) {
    this.recentGifs = this.recentGifs.filter((g) => g.id !== gif.id);
    this.recentGifs.unshift(gif);

    if (this.recentGifs.length > this.maxRecent) {
      this.recentGifs.pop();
    }

    this.saveToStorage();
  }

  /**
   * Get recent GIFs
   * @returns {Array} Recent GIFs
   */
  getRecent() {
    return this.recentGifs;
  }
}

// Singleton instances
export const emojiPicker = new EmojiPicker();
export const gifPicker = new GifPicker();
