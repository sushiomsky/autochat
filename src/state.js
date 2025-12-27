/**
 * State Management System
 * Centralized state with reactivity
 */

class StateManager {
  constructor() {
    this.state = {};
    this.listeners = new Map();
    this.initialized = false;
  }

  /**
   * Initialize state from storage
   */
  async init() {
    if (this.initialized) return;

    const data = await chrome.storage.local.get(null);
    this.state = {
      // Messages
      messageList: data.messageList || '',
      customPhrases: data.customPhrases || [],

      // Basic settings
      sendMode: data.sendMode || 'random',
      minInterval: data.minInterval || 60,
      maxInterval: data.maxInterval || 120,

      // Advanced settings
      dailyLimit: data.dailyLimit || 0,
      typingSimulation: data.typingSimulation !== false,
      variableDelays: data.variableDelays !== false,
      antiRepetition: data.antiRepetition !== false,
      templateVariables: data.templateVariables !== false,
      activeHours: data.activeHours || false,
      activeHoursStart: data.activeHoursStart || 9,
      activeHoursEnd: data.activeHoursEnd || 22,

      // Statistics
      messagesSentToday: data.messagesSentToday || 0,
      totalMessagesSent: data.totalMessagesSent || 0,
      lastResetDate: data.lastResetDate || new Date().toDateString(),

      // UI state
      theme: data.theme || 'light',
      isAutoSendActive: false,
      isPaused: false,

      // New features
      notificationsEnabled: data.notificationsEnabled !== false,
      notificationSound: data.notificationSound !== false,
      dryRunMode: data.dryRunMode || false,
      analyticsEnabled: data.analyticsEnabled !== false,

      // Categories
      categories: data.categories || null,
      categorizedPhrases: data.categorizedPhrases || [],
      phraseTags: data.phraseTags || [],

      // Recents
      recentCommands: data.recentCommands || [],
      recentEmojis: data.recentEmojis || [],
      favoriteEmojis: data.favoriteEmojis || []
    };

    this.initialized = true;
  }

  /**
   * Get state value
   * @param {string} key - State key
   * @returns {*} State value
   */
  get(key) {
    return this.state[key];
  }

  /**
   * Set state value
   * @param {string} key - State key
   * @param {*} value - New value
   * @param {boolean} save - Save to storage
   */
  async set(key, value, save = true) {
    const oldValue = this.state[key];
    this.state[key] = value;

    // Notify listeners
    this.notify(key, value, oldValue);

    // Save to storage
    if (save) {
      await this.save(key);
    }
  }

  /**
   * Set multiple values
   * @param {object} updates - Key-value pairs
   * @param {boolean} save - Save to storage
   */
  async setMultiple(updates, save = true) {
    const changes = [];

    Object.entries(updates).forEach(([key, value]) => {
      const oldValue = this.state[key];
      this.state[key] = value;
      changes.push({ key, value, oldValue });
    });

    // Notify all listeners
    changes.forEach(({ key, value, oldValue }) => {
      this.notify(key, value, oldValue);
    });

    // Save to storage
    if (save) {
      await chrome.storage.local.set(updates);
    }
  }

  /**
   * Save state to storage
   * @param {string} key - Specific key (optional)
   */
  async save(key = null) {
    if (key) {
      await chrome.storage.local.set({ [key]: this.state[key] });
    } else {
      await chrome.storage.local.set(this.state);
    }
  }

  /**
   * Subscribe to state changes
   * @param {string} key - State key to watch
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }

    this.listeners.get(key).add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(key)?.delete(callback);
    };
  }

  /**
   * Notify listeners of state change
   * @param {string} key - State key
   * @param {*} value - New value
   * @param {*} oldValue - Old value
   */
  notify(key, value, oldValue) {
    const listeners = this.listeners.get(key);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(value, oldValue);
        } catch (error) {
          console.error('[State] Listener error:', error);
        }
      });
    }

    // Notify wildcard listeners (listening to all changes)
    const wildcardListeners = this.listeners.get('*');
    if (wildcardListeners) {
      wildcardListeners.forEach(callback => {
        try {
          callback(key, value, oldValue);
        } catch (error) {
          console.error('[State] Wildcard listener error:', error);
        }
      });
    }
  }

  /**
   * Reset statistics
   */
  async resetStats() {
    await this.setMultiple({
      messagesSentToday: 0,
      totalMessagesSent: 0,
      lastResetDate: new Date().toDateString()
    });
  }

  /**
   * Export all state as JSON
   * @returns {string} JSON string
   */
  export() {
    return JSON.stringify({
      version: '4.3',
      exported: new Date().toISOString(),
      state: this.state
    }, null, 2);
  }

  /**
   * Import state from JSON
   * @param {object} data - Imported data
   */
  async import(data) {
    if (data.state) {
      await this.setMultiple(data.state);
    }
  }

  /**
   * Get snapshot of current state
   * @returns {object} State copy
   */
  getSnapshot() {
    return { ...this.state };
  }
}

// Singleton instance
const state = new StateManager();
const state_instance = state;
if (typeof window !== 'undefined') window.state = state;
if (typeof self !== 'undefined') self.state = state;
// Export for unit tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { StateManager, state };
}
