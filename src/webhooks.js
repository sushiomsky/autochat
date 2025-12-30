/**
 * Webhook Integration Module
 * Handles webhook configuration, management, and triggering
 */

export class WebhookManager {
  constructor() {
    this.webhooks = [];
    this.enabled = true;
    this.retryAttempts = 3;
    this.retryDelay = 1000; // milliseconds
    this.timeout = 10000; // 10 seconds
    this.maxWebhooks = 10;
    this.loadWebhooks();
  }

  /**
   * Load webhooks from storage
   */
  async loadWebhooks() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['webhooks', 'webhooksEnabled'], (data) => {
        this.webhooks = data.webhooks || [];
        this.enabled = data.webhooksEnabled !== false;
        resolve();
      });
    });
  }

  /**
   * Save webhooks to storage
   */
  async saveWebhooks() {
    return new Promise((resolve) => {
      chrome.storage.local.set({
        webhooks: this.webhooks,
        webhooksEnabled: this.enabled
      }, () => resolve());
    });
  }

  /**
   * Generate unique ID for webhook
   */
  generateId() {
    return `webhook_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Add a new webhook
   * @param {object} webhook - Webhook configuration
   * @returns {object} Created webhook
   */
  async addWebhook(webhook) {
    if (this.webhooks.length >= this.maxWebhooks) {
      throw new Error(`Maximum of ${this.maxWebhooks} webhooks allowed`);
    }

    if (!webhook.url || !webhook.url.startsWith('http')) {
      throw new Error('Invalid webhook URL');
    }

    const newWebhook = {
      id: this.generateId(),
      name: webhook.name || 'Unnamed Webhook',
      url: webhook.url,
      events: webhook.events || ['message_sent'],
      method: webhook.method || 'POST',
      headers: webhook.headers || {},
      enabled: webhook.enabled !== false,
      createdAt: new Date().toISOString(),
      lastTriggered: null,
      triggerCount: 0,
      failureCount: 0
    };

    this.webhooks.push(newWebhook);
    await this.saveWebhooks();
    return newWebhook;
  }

  /**
   * Update an existing webhook
   * @param {string} id - Webhook ID
   * @param {object} updates - Fields to update
   * @returns {object} Updated webhook
   */
  async updateWebhook(id, updates) {
    const webhook = this.webhooks.find(w => w.id === id);
    if (!webhook) {
      throw new Error('Webhook not found');
    }

    // Validate URL if being updated
    if (updates.url && !updates.url.startsWith('http')) {
      throw new Error('Invalid webhook URL');
    }

    Object.assign(webhook, updates);
    await this.saveWebhooks();
    return webhook;
  }

  /**
   * Delete a webhook
   * @param {string} id - Webhook ID
   */
  async deleteWebhook(id) {
    const index = this.webhooks.findIndex(w => w.id === id);
    if (index === -1) {
      throw new Error('Webhook not found');
    }

    this.webhooks.splice(index, 1);
    await this.saveWebhooks();
  }

  /**
   * Get all webhooks
   * @returns {Array} List of webhooks
   */
  getWebhooks() {
    return [...this.webhooks];
  }

  /**
   * Get a specific webhook
   * @param {string} id - Webhook ID
   * @returns {object} Webhook
   */
  getWebhook(id) {
    return this.webhooks.find(w => w.id === id);
  }

  /**
   * Trigger webhooks for an event
   * @param {string} eventType - Event type (message_sent, campaign_complete, error, etc.)
   * @param {object} data - Event data
   */
  async trigger(eventType, data) {
    if (!this.enabled) {

      return;
    }

    const activeWebhooks = this.webhooks.filter(
      w => w.enabled && w.events.includes(eventType)
    );

    if (activeWebhooks.length === 0) {
      return;
    }



    const promises = activeWebhooks.map(webhook =>
      this.sendWebhook(webhook, eventType, data)
    );

    await Promise.allSettled(promises);
  }

  /**
   * Send webhook request
   * @param {object} webhook - Webhook configuration
   * @param {string} eventType - Event type
   * @param {object} data - Event data
   */
  async sendWebhook(webhook, eventType, data) {
    const payload = {
      event: eventType,
      timestamp: new Date().toISOString(),
      data: data,
      source: 'AutoChat',
      version: chrome.runtime.getManifest().version
    };

    let lastError = null;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(webhook.url, {
          method: webhook.method,
          headers: {
            'Content-Type': 'application/json',
            ...webhook.headers
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Success
        webhook.lastTriggered = new Date().toISOString();
        webhook.triggerCount++;
        await this.saveWebhooks();


        return { success: true, webhook: webhook.name };

      } catch (error) {
        lastError = error;
        console.warn(`[Webhooks] Attempt ${attempt}/${this.retryAttempts} failed for ${webhook.name}:`, error.message);

        if (attempt < this.retryAttempts) {
          await this.sleep(this.retryDelay * attempt); // Exponential backoff
        }
      }
    }

    // All attempts failed
    webhook.failureCount++;
    await this.saveWebhooks();

    console.error(`[Webhooks] Failed to send webhook ${webhook.name} after ${this.retryAttempts} attempts:`, lastError);
    return { success: false, webhook: webhook.name, error: lastError.message };
  }

  /**
   * Test a webhook
   * @param {string} id - Webhook ID
   * @returns {object} Test result
   */
  async testWebhook(id) {
    const webhook = this.webhooks.find(w => w.id === id);
    if (!webhook) {
      throw new Error('Webhook not found');
    }

    const testData = {
      test: true,
      message: 'This is a test webhook from AutoChat'
    };

    return await this.sendWebhook(webhook, 'test', testData);
  }

  /**
   * Enable/disable webhooks globally
   * @param {boolean} enabled - Enable state
   */
  async setEnabled(enabled) {
    this.enabled = enabled;
    return new Promise((resolve) => {
      chrome.storage.local.set({ webhooksEnabled: enabled }, () => resolve());
    });
  }

  /**
   * Enable/disable a specific webhook
   * @param {string} id - Webhook ID
   * @param {boolean} enabled - Enable state
   */
  async setWebhookEnabled(id, enabled) {
    const webhook = this.webhooks.find(w => w.id === id);
    if (!webhook) {
      throw new Error('Webhook not found');
    }

    webhook.enabled = enabled;
    await this.saveWebhooks();
  }

  /**
   * Get webhook statistics
   * @returns {object} Statistics
   */
  getStats() {
    return {
      total: this.webhooks.length,
      enabled: this.webhooks.filter(w => w.enabled).length,
      disabled: this.webhooks.filter(w => !w.enabled).length,
      totalTriggers: this.webhooks.reduce((sum, w) => sum + w.triggerCount, 0),
      totalFailures: this.webhooks.reduce((sum, w) => sum + w.failureCount, 0)
    };
  }

  /**
   * Clear webhook statistics
   * @param {string} id - Webhook ID (optional, clears all if not provided)
   */
  async clearStats(id = null) {
    if (id) {
      const webhook = this.webhooks.find(w => w.id === id);
      if (webhook) {
        webhook.triggerCount = 0;
        webhook.failureCount = 0;
        webhook.lastTriggered = null;
      }
    } else {
      this.webhooks.forEach(webhook => {
        webhook.triggerCount = 0;
        webhook.failureCount = 0;
        webhook.lastTriggered = null;
      });
    }
    await this.saveWebhooks();
  }

  /**
   * Sleep utility for retries
   * @param {number} ms - Milliseconds to sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get supported event types
   * @returns {Array} List of event types with descriptions
   */
  static getEventTypes() {
    return [
      { value: 'message_sent', label: 'Message Sent', description: 'Triggered when a message is sent' },
      { value: 'campaign_started', label: 'Campaign Started', description: 'Triggered when auto-send starts' },
      { value: 'campaign_stopped', label: 'Campaign Stopped', description: 'Triggered when auto-send stops' },
      { value: 'campaign_paused', label: 'Campaign Paused', description: 'Triggered when auto-send is paused' },
      { value: 'campaign_resumed', label: 'Campaign Resumed', description: 'Triggered when auto-send is resumed' },
      { value: 'daily_limit_reached', label: 'Daily Limit Reached', description: 'Triggered when daily limit is reached' },
      { value: 'error', label: 'Error', description: 'Triggered when an error occurs' },
      { value: 'milestone', label: 'Milestone', description: 'Triggered when a milestone is reached' }
    ];
  }

  /**
   * Validate webhook configuration
   * @param {object} webhook - Webhook to validate
   * @returns {object} Validation result
   */
  static validate(webhook) {
    const errors = [];

    if (!webhook.name || webhook.name.trim().length === 0) {
      errors.push('Name is required');
    }

    if (!webhook.url || !webhook.url.startsWith('http')) {
      errors.push('Valid URL is required (must start with http:// or https://)');
    }

    if (!webhook.events || webhook.events.length === 0) {
      errors.push('At least one event must be selected');
    }

    if (webhook.method && !['GET', 'POST', 'PUT', 'PATCH'].includes(webhook.method)) {
      errors.push('Invalid HTTP method');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Singleton instance
export const webhooks = new WebhookManager();
