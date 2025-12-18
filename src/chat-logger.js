/* chat-logger.js — Chat Message Logging System
   Captures and stores all chat messages for searchable history
*/

class ChatLogger {
  constructor() {
    this.storageKey = 'chatLogs';
    this.maxMessages = 10000; // Maximum messages to store
    this.maxStorageSize = 5 * 1024 * 1024; // 5MB max (chrome.storage.local limit is ~5-10MB)
    this.observer = null;
    this.isLogging = false;
    this.messageQueue = [];
    this.flushInterval = null;
    this.processedElements = new WeakSet(); // Track processed DOM elements
  }

  /**
   * Start logging messages
   * @param {string} containerSelector - CSS selector for message container
   * @param {Object} options - Logging options
   */
  async startLogging(containerSelector, options = {}) {
    if (this.isLogging) {
      console.log('[ChatLogger] Already logging');
      return;
    }

    const container = document.querySelector(containerSelector);
    if (!container) {
      console.warn('[ChatLogger] Message container not found:', containerSelector);
      return;
    }

    this.isLogging = true;
    this.containerSelector = containerSelector;
    this.options = {
      captureOutgoing: true,
      captureIncoming: true,
      captureSender: true,
      ...options,
    };

    // Capture existing messages
    await this.captureExistingMessages(container);

    // Start observing for new messages
    this.observer = new MutationObserver((mutations) => {
      this.handleMutations(mutations);
    });

    this.observer.observe(container, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    // Flush queue periodically (every 5 seconds)
    this.flushInterval = setInterval(() => {
      this.flushQueue();
    }, 5000);

    console.log('[ChatLogger] Started logging messages');
  }

  /**
   * Stop logging messages
   */
  stopLogging() {
    if (!this.isLogging) return;

    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }

    // Flush any remaining messages
    this.flushQueue();

    this.isLogging = false;
    console.log('[ChatLogger] Stopped logging messages');
  }

  /**
   * Capture existing messages in the container
   */
  async captureExistingMessages(container) {
    const messages = this.extractMessagesFromContainer(container);
    for (const message of messages) {
      this.queueMessage(message);
    }
    await this.flushQueue();
  }

  /**
   * Handle DOM mutations
   */
  handleMutations(mutations) {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === 1) {
            // Element node
            this.processNewElement(node);
          }
        }
      }
    }
  }

  /**
   * Process a newly added element
   */
  processNewElement(element) {
    // Skip if already processed
    if (this.processedElements.has(element)) return;
    this.processedElements.add(element);

    const messages = this.extractMessagesFromElement(element);
    for (const message of messages) {
      this.queueMessage(message);
    }
  }

  /**
   * Extract messages from container
   */
  extractMessagesFromContainer(container) {
    const messages = [];

    // Common message selectors for various chat platforms
    const selectors = [
      '.message',
      '.msg',
      '.message-text',
      '.bubble',
      '.chat-message',
      '.text',
      '.reply',
      '.chat__message',
      '[role="article"]',
      '[class*="message"]',
      '[class*="msg"]',
      '[data-message-id]',
    ];

    for (const selector of selectors) {
      const elements = container.querySelectorAll(selector);
      for (const el of elements) {
        if (!this.processedElements.has(el)) {
          const message = this.extractMessageFromElement(el);
          if (message) {
            messages.push(message);
            this.processedElements.add(el);
          }
        }
      }
    }

    return messages;
  }

  /**
   * Extract messages from a single element
   */
  extractMessagesFromElement(element) {
    const messages = [];

    // Check if element itself is a message
    const message = this.extractMessageFromElement(element);
    if (message) {
      messages.push(message);
      return messages;
    }

    // Check children
    const childMessages = this.extractMessagesFromContainer(element);
    messages.push(...childMessages);

    return messages;
  }

  /**
   * Extract message data from element
   */
  extractMessageFromElement(element) {
    const text = (element.textContent || '').trim();
    if (!text || text.length === 0) return null;

    // Skip if text is too short (likely not a real message)
    if (text.length < 2) return null;

    // Extract metadata
    const timestamp = this.extractTimestamp(element);
    const sender = this.options && this.options.captureSender ? this.extractSender(element) : null;
    const direction = this.detectMessageDirection(element);

    // Skip based on options
    if (this.options && !this.options.captureOutgoing && direction === 'outgoing') return null;
    if (this.options && !this.options.captureIncoming && direction === 'incoming') return null;

    return {
      id: this.generateMessageId(text, timestamp),
      text: text.substring(0, 1000), // Limit message length
      sender: sender ? sender.substring(0, 100) : 'Unknown',
      timestamp: timestamp,
      direction: direction,
      url: window.location.href,
      platform: this.detectPlatform(),
    };
  }

  /**
   * Extract timestamp from element
   */
  extractTimestamp(element) {
    // Try to find timestamp in element or nearby
    const timeSelectors = [
      '[data-timestamp]',
      '[datetime]',
      'time',
      '.time',
      '.timestamp',
      '[class*="time"]',
      '[class*="timestamp"]',
    ];

    for (const selector of timeSelectors) {
      const timeEl = element.querySelector(selector) || element.closest(selector);
      if (timeEl) {
        const timestamp =
          timeEl.getAttribute('data-timestamp') ||
          timeEl.getAttribute('datetime') ||
          timeEl.textContent;
        if (timestamp) {
          const parsed = new Date(timestamp);
          if (!isNaN(parsed.getTime())) {
            return parsed.toISOString();
          }
        }
      }
    }

    // Fallback to current time
    return new Date().toISOString();
  }

  /**
   * Extract sender from element
   */
  extractSender(element) {
    const senderSelectors = [
      '[data-sender]',
      '[data-author]',
      '.sender',
      '.author',
      '.username',
      '[class*="sender"]',
      '[class*="author"]',
      '[class*="username"]',
    ];

    for (const selector of senderSelectors) {
      const senderEl = element.querySelector(selector) || element.closest(selector);
      if (senderEl) {
        const sender =
          senderEl.getAttribute('data-sender') ||
          senderEl.getAttribute('data-author') ||
          senderEl.textContent?.trim();
        if (sender && sender.length > 0 && sender.length < 100) {
          return sender;
        }
      }
    }

    return 'Unknown';
  }

  /**
   * Detect if message is incoming or outgoing
   */
  detectMessageDirection(element) {
    const classes = element.className || '';
    const id = element.id || '';

    // Common patterns for outgoing messages
    if (
      classes.match(/\b(me|self|own|sent|outgoing|right)\b/i) ||
      id.match(/\b(me|self|own|sent|outgoing)\b/i)
    ) {
      return 'outgoing';
    }

    // Common patterns for incoming messages
    if (
      classes.match(/\b(them|other|received|incoming|left)\b/i) ||
      id.match(/\b(them|other|received|incoming)\b/i)
    ) {
      return 'incoming';
    }

    return 'unknown';
  }

  /**
   * Detect chat platform
   */
  detectPlatform() {
    const hostname = window.location.hostname.toLowerCase();
    if (hostname.endsWith('.web.whatsapp.com') || hostname === 'web.whatsapp.com')
      return 'WhatsApp';
    if (hostname.endsWith('.discord.com') || hostname === 'discord.com') return 'Discord';
    if (hostname.endsWith('.web.telegram.org') || hostname === 'web.telegram.org')
      return 'Telegram';
    if (hostname.endsWith('.messenger.com') || hostname === 'messenger.com')
      return 'Facebook Messenger';
    if (hostname.endsWith('.slack.com') || hostname === 'slack.com') return 'Slack';
    if (hostname.endsWith('.teams.microsoft.com') || hostname === 'teams.microsoft.com')
      return 'Microsoft Teams';
    return 'Unknown';
  }

  /**
   * Generate unique message ID
   */
  generateMessageId(text, timestamp) {
    const str = `${text}-${timestamp}`;
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `msg_${Math.abs(hash)}_${Date.now()}`;
  }

  /**
   * Queue message for batch saving
   */
  queueMessage(message) {
    // Check for duplicates in queue
    const isDuplicate = this.messageQueue.some(
      (m) =>
        m.text === message.text &&
        Math.abs(new Date(m.timestamp) - new Date(message.timestamp)) < 1000
    );

    if (!isDuplicate) {
      this.messageQueue.push(message);
    }
  }

  /**
   * Flush message queue to storage
   */
  async flushQueue() {
    if (this.messageQueue.length === 0) return;

    const messages = [...this.messageQueue];
    this.messageQueue = [];

    try {
      await this.saveMessages(messages);
      console.log(`[ChatLogger] Saved ${messages.length} messages`);
    } catch (error) {
      console.error('[ChatLogger] Failed to save messages:', error);
      // Re-queue on failure
      this.messageQueue.unshift(...messages);
    }
  }

  /**
   * Save messages to storage
   */
  async saveMessages(newMessages) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([this.storageKey], (data) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }

        let logs = data[this.storageKey] || [];
        logs.push(...newMessages);

        // Enforce maximum message count
        if (logs.length > this.maxMessages) {
          logs = logs.slice(-this.maxMessages); // Keep most recent
        }

        // Check storage size and trim if needed
        const estimatedSize = JSON.stringify(logs).length;
        if (estimatedSize > this.maxStorageSize) {
          // Remove oldest 20% of messages
          const removeCount = Math.floor(logs.length * 0.2);
          logs = logs.slice(removeCount);
          console.warn('[ChatLogger] Storage limit reached, removed oldest messages');
        }

        chrome.storage.local.set({ [this.storageKey]: logs }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      });
    });
  }

  /**
   * Get all logged messages
   */
  async getMessages(options = {}) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([this.storageKey], (data) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }

        let messages = data[this.storageKey] || [];

        // Apply filters
        if (options.search) {
          const searchLower = options.search.toLowerCase();
          messages = messages.filter(
            (m) =>
              m.text.toLowerCase().includes(searchLower) ||
              m.sender.toLowerCase().includes(searchLower)
          );
        }

        if (options.startDate) {
          const start = new Date(options.startDate);
          messages = messages.filter((m) => new Date(m.timestamp) >= start);
        }

        if (options.endDate) {
          const end = new Date(options.endDate);
          messages = messages.filter((m) => new Date(m.timestamp) <= end);
        }

        if (options.sender) {
          messages = messages.filter((m) =>
            m.sender.toLowerCase().includes(options.sender.toLowerCase())
          );
        }

        if (options.direction) {
          messages = messages.filter((m) => m.direction === options.direction);
        }

        if (options.platform) {
          messages = messages.filter((m) => m.platform === options.platform);
        }

        // Sort by timestamp (newest first by default)
        messages.sort((a, b) => {
          const dateA = new Date(a.timestamp);
          const dateB = new Date(b.timestamp);
          return options.sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });

        // Apply pagination
        if (options.limit) {
          const offset = options.offset || 0;
          messages = messages.slice(offset, offset + options.limit);
        }

        resolve(messages);
      });
    });
  }

  /**
   * Get message statistics
   */
  async getStats() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([this.storageKey], (data) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }

        const messages = data[this.storageKey] || [];

        const stats = {
          total: messages.length,
          incoming: messages.filter((m) => m.direction === 'incoming').length,
          outgoing: messages.filter((m) => m.direction === 'outgoing').length,
          unknown: messages.filter((m) => m.direction === 'unknown').length,
          platforms: {},
          senders: {},
          dateRange: {
            earliest: null,
            latest: null,
          },
        };

        // Count by platform
        messages.forEach((m) => {
          stats.platforms[m.platform] = (stats.platforms[m.platform] || 0) + 1;
          stats.senders[m.sender] = (stats.senders[m.sender] || 0) + 1;
        });

        // Date range
        if (messages.length > 0) {
          const timestamps = messages.map((m) => new Date(m.timestamp)).sort((a, b) => a - b);
          stats.dateRange.earliest = timestamps[0].toISOString();
          stats.dateRange.latest = timestamps[timestamps.length - 1].toISOString();
        }

        resolve(stats);
      });
    });
  }

  /**
   * Clear all logged messages
   */
  async clearLogs() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [this.storageKey]: [] }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          this.messageQueue = [];
          console.log('[ChatLogger] Cleared all logs');
          resolve();
        }
      });
    });
  }

  /**
   * Export messages to JSON
   */
  async exportToJSON() {
    const messages = await this.getMessages();
    const stats = await this.getStats();

    return JSON.stringify(
      {
        exportDate: new Date().toISOString(),
        stats: stats,
        messages: messages,
      },
      null,
      2
    );
  }

  /**
   * Export messages to CSV
   */
  async exportToCSV() {
    const messages = await this.getMessages();

    const headers = ['ID', 'Timestamp', 'Sender', 'Direction', 'Platform', 'Text'];
    const rows = [headers];

    messages.forEach((m) => {
      rows.push([
        m.id,
        m.timestamp,
        m.sender,
        m.direction,
        m.platform,
        `"${m.text.replace(/"/g, '""')}"`, // Escape quotes
      ]);
    });

    return rows.map((row) => row.join(',')).join('\n');
  }
}

// Export for use in content scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChatLogger;
}
