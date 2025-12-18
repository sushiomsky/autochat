/* background-tab-manager.js — Background Tab Management
   Manages AutoChat state across multiple tabs, including inactive ones
*/

class BackgroundTabManager {
  constructor() {
    this.activeTabs = new Map(); // tabId -> tab state
    this.storageKey = 'backgroundTabsState';
  }

  /**
   * Initialize the manager
   */
  async init() {
    // Load saved state
    await this.loadState();

    // Set up message listener
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // Keep channel open for async response
    });

    // Monitor tab changes
    chrome.tabs.onRemoved.addListener((tabId) => {
      this.removeTab(tabId);
    });

    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete') {
        this.updateTabUrl(tabId, tab.url);
      }
    });

    console.log('[BackgroundTabManager] Initialized');
  }

  /**
   * Handle messages from content scripts or popup
   */
  async handleMessage(request, sender, sendResponse) {
    const tabId = sender.tab?.id;

    switch (request.action) {
      case 'registerTab':
        if (tabId) {
          await this.registerTab(tabId, request.config);
          sendResponse({ success: true });
        }
        break;

      case 'unregisterTab':
        if (tabId) {
          await this.unregisterTab(tabId);
          sendResponse({ success: true });
        }
        break;

      case 'updateTabState':
        if (tabId) {
          await this.updateTabState(tabId, request.state);
          sendResponse({ success: true });
        }
        break;

      case 'getTabState':
        if (tabId) {
          const state = this.getTabState(tabId);
          sendResponse({ state });
        }
        break;

      case 'getAllTabs':
        const tabs = await this.getAllTabs();
        sendResponse({ tabs });
        break;

      case 'isTabActive':
        if (request.tabId !== undefined) {
          const isActive = this.isTabActive(request.tabId);
          sendResponse({ isActive });
        }
        break;

      case 'sendToTab':
        if (request.tabId && request.message) {
          await this.sendMessageToTab(request.tabId, request.message);
          sendResponse({ success: true });
        }
        break;
    }
  }

  /**
   * Register a tab for background operation
   */
  async registerTab(tabId, config = {}) {
    const tab = await chrome.tabs.get(tabId);

    const tabState = {
      tabId,
      url: tab.url,
      title: tab.title,
      isRunning: false,
      lastActivity: new Date().toISOString(),
      config: config,
      registered: new Date().toISOString(),
    };

    this.activeTabs.set(tabId, tabState);
    await this.saveState();

    console.log('[BackgroundTabManager] Registered tab:', tabId);
    return tabState;
  }

  /**
   * Unregister a tab
   */
  async unregisterTab(tabId) {
    this.activeTabs.delete(tabId);
    await this.saveState();
    console.log('[BackgroundTabManager] Unregistered tab:', tabId);
  }

  /**
   * Update tab state
   */
  async updateTabState(tabId, stateUpdate) {
    const tabState = this.activeTabs.get(tabId);
    if (!tabState) {
      console.warn('[BackgroundTabManager] Tab not registered:', tabId);
      return;
    }

    Object.assign(tabState, stateUpdate);
    tabState.lastActivity = new Date().toISOString();

    this.activeTabs.set(tabId, tabState);
    await this.saveState();
  }

  /**
   * Get tab state
   */
  getTabState(tabId) {
    return this.activeTabs.get(tabId) || null;
  }

  /**
   * Get all active tabs
   */
  async getAllTabs() {
    const tabs = [];
    for (const [tabId, state] of this.activeTabs.entries()) {
      // Verify tab still exists
      try {
        const tab = await chrome.tabs.get(tabId);
        tabs.push({
          ...state,
          isActive: tab.active,
          windowId: tab.windowId,
        });
      } catch (error) {
        // Tab no longer exists, remove it
        this.activeTabs.delete(tabId);
      }
    }
    await this.saveState();
    return tabs;
  }

  /**
   * Check if tab is active (AutoChat is running)
   */
  isTabActive(tabId) {
    const state = this.activeTabs.get(tabId);
    return state?.isRunning || false;
  }

  /**
   * Remove a tab
   */
  async removeTab(tabId) {
    this.activeTabs.delete(tabId);
    await this.saveState();
    console.log('[BackgroundTabManager] Removed tab:', tabId);
  }

  /**
   * Update tab URL
   */
  async updateTabUrl(tabId, url) {
    const state = this.activeTabs.get(tabId);
    if (state) {
      state.url = url;
      await this.saveState();
    }
  }

  /**
   * Send message to a specific tab
   */
  async sendMessageToTab(tabId, message) {
    try {
      await chrome.tabs.sendMessage(tabId, message);
      console.log('[BackgroundTabManager] Sent message to tab:', tabId);
    } catch (error) {
      console.error('[BackgroundTabManager] Failed to send message to tab:', tabId, error);
      // Tab might be closed or unresponsive, remove it
      await this.removeTab(tabId);
    }
  }

  /**
   * Broadcast message to all registered tabs
   */
  async broadcastToAllTabs(message) {
    const promises = [];
    for (const tabId of this.activeTabs.keys()) {
      promises.push(this.sendMessageToTab(tabId, message));
    }
    await Promise.allSettled(promises);
  }

  /**
   * Load state from storage
   */
  async loadState() {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.storageKey], (data) => {
        if (data[this.storageKey]) {
          // Convert string keys back to numbers for tab IDs
          const entries = Object.entries(data[this.storageKey]).map(([key, value]) => {
            return [parseInt(key, 10), value];
          });
          this.activeTabs = new Map(entries);
          console.log('[BackgroundTabManager] Loaded state:', this.activeTabs.size, 'tabs');
        }
        resolve();
      });
    });
  }

  /**
   * Save state to storage
   */
  async saveState() {
    return new Promise((resolve) => {
      const stateObj = Object.fromEntries(
        Array.from(this.activeTabs.entries()).map(([key, value]) => {
          return [key.toString(), value];
        })
      );
      chrome.storage.local.set({ [this.storageKey]: stateObj }, () => {
        resolve();
      });
    });
  }

  /**
   * Clean up inactive tabs (not used in last 24 hours)
   */
  async cleanupInactiveTabs() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    for (const [tabId, state] of this.activeTabs.entries()) {
      const lastActivity = new Date(state.lastActivity);
      if (lastActivity < oneDayAgo) {
        await this.removeTab(tabId);
      }
    }
  }

  /**
   * Get count of running tabs
   */
  getRunningTabsCount() {
    let count = 0;
    for (const state of this.activeTabs.values()) {
      if (state.isRunning) count++;
    }
    return count;
  }
}

// Create singleton instance
const backgroundTabManager = new BackgroundTabManager();

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BackgroundTabManager;
}
