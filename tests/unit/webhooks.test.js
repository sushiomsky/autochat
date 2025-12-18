/**
 * Tests for Webhook Module
 */

describe('WebhookManager', () => {
  let WebhookManager;
  let webhookManager;
  let mockFetch;

  beforeEach(async () => {
    // Mock fetch
    mockFetch = jest.fn();
    global.fetch = mockFetch;

    // Mock chrome.runtime.getManifest
    chrome.runtime.getManifest = jest.fn(() => ({ version: '4.5.0' }));

    // Create inline class for testing (mirrors src/webhooks.js)
    WebhookManager = class {
      constructor() {
        this.webhooks = [];
        this.enabled = true;
        this.retryAttempts = 3;
        this.retryDelay = 1000;
        this.timeout = 10000;
        this.maxWebhooks = 10;
      }

      async loadWebhooks() {
        return new Promise((resolve) => {
          chrome.storage.local.get(['webhooks', 'webhooksEnabled'], (data) => {
            this.webhooks = data.webhooks || [];
            this.enabled = data.webhooksEnabled !== false;
            resolve();
          });
        });
      }

      async saveWebhooks() {
        return new Promise((resolve) => {
          chrome.storage.local.set(
            {
              webhooks: this.webhooks,
              webhooksEnabled: this.enabled,
            },
            () => resolve()
          );
        });
      }

      generateId() {
        return `webhook_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      }

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
          failureCount: 0,
        };

        this.webhooks.push(newWebhook);
        await this.saveWebhooks();
        return newWebhook;
      }

      async updateWebhook(id, updates) {
        const webhook = this.webhooks.find((w) => w.id === id);
        if (!webhook) {
          throw new Error('Webhook not found');
        }

        if (updates.url && !updates.url.startsWith('http')) {
          throw new Error('Invalid webhook URL');
        }

        Object.assign(webhook, updates);
        await this.saveWebhooks();
        return webhook;
      }

      async deleteWebhook(id) {
        const index = this.webhooks.findIndex((w) => w.id === id);
        if (index === -1) {
          throw new Error('Webhook not found');
        }

        this.webhooks.splice(index, 1);
        await this.saveWebhooks();
      }

      getWebhooks() {
        return [...this.webhooks];
      }

      getWebhook(id) {
        return this.webhooks.find((w) => w.id === id);
      }

      async trigger(eventType, data) {
        if (!this.enabled) {
          console.log('[Webhooks] Webhooks disabled, skipping trigger');
          return;
        }

        const activeWebhooks = this.webhooks.filter(
          (w) => w.enabled && w.events.includes(eventType)
        );

        if (activeWebhooks.length === 0) {
          return;
        }

        console.log(
          `[Webhooks] Triggering ${activeWebhooks.length} webhook(s) for event: ${eventType}`
        );

        const promises = activeWebhooks.map((webhook) =>
          this.sendWebhook(webhook, eventType, data)
        );

        await Promise.allSettled(promises);
      }

      async sendWebhook(webhook, eventType, data) {
        const payload = {
          event: eventType,
          timestamp: new Date().toISOString(),
          data: data,
          source: 'AutoChat',
          version: chrome.runtime.getManifest().version,
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
                ...webhook.headers,
              },
              body: JSON.stringify(payload),
              signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            webhook.lastTriggered = new Date().toISOString();
            webhook.triggerCount++;
            await this.saveWebhooks();

            console.log(`[Webhooks] Successfully sent to ${webhook.name}`);
            return { success: true, webhook: webhook.name };
          } catch (error) {
            lastError = error;
            console.warn(
              `[Webhooks] Attempt ${attempt}/${this.retryAttempts} failed for ${webhook.name}:`,
              error.message
            );

            if (attempt < this.retryAttempts) {
              await this.sleep(this.retryDelay * attempt);
            }
          }
        }

        webhook.failureCount++;
        await this.saveWebhooks();

        console.error(
          `[Webhooks] Failed to send webhook ${webhook.name} after ${this.retryAttempts} attempts:`,
          lastError
        );
        return { success: false, webhook: webhook.name, error: lastError.message };
      }

      async testWebhook(id) {
        const webhook = this.webhooks.find((w) => w.id === id);
        if (!webhook) {
          throw new Error('Webhook not found');
        }

        const testData = {
          test: true,
          message: 'This is a test webhook from AutoChat',
        };

        return await this.sendWebhook(webhook, 'test', testData);
      }

      async setEnabled(enabled) {
        this.enabled = enabled;
        return new Promise((resolve) => {
          chrome.storage.local.set({ webhooksEnabled: enabled }, () => resolve());
        });
      }

      async setWebhookEnabled(id, enabled) {
        const webhook = this.webhooks.find((w) => w.id === id);
        if (!webhook) {
          throw new Error('Webhook not found');
        }

        webhook.enabled = enabled;
        await this.saveWebhooks();
      }

      getStats() {
        return {
          total: this.webhooks.length,
          enabled: this.webhooks.filter((w) => w.enabled).length,
          disabled: this.webhooks.filter((w) => !w.enabled).length,
          totalTriggers: this.webhooks.reduce((sum, w) => sum + w.triggerCount, 0),
          totalFailures: this.webhooks.reduce((sum, w) => sum + w.failureCount, 0),
        };
      }

      async clearStats(id = null) {
        if (id) {
          const webhook = this.webhooks.find((w) => w.id === id);
          if (webhook) {
            webhook.triggerCount = 0;
            webhook.failureCount = 0;
            webhook.lastTriggered = null;
          }
        } else {
          this.webhooks.forEach((webhook) => {
            webhook.triggerCount = 0;
            webhook.failureCount = 0;
            webhook.lastTriggered = null;
          });
        }
        await this.saveWebhooks();
      }

      sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }

      static getEventTypes() {
        return [
          {
            value: 'message_sent',
            label: 'Message Sent',
            description: 'Triggered when a message is sent',
          },
          {
            value: 'campaign_started',
            label: 'Campaign Started',
            description: 'Triggered when auto-send starts',
          },
          {
            value: 'campaign_stopped',
            label: 'Campaign Stopped',
            description: 'Triggered when auto-send stops',
          },
          {
            value: 'campaign_paused',
            label: 'Campaign Paused',
            description: 'Triggered when auto-send is paused',
          },
          {
            value: 'campaign_resumed',
            label: 'Campaign Resumed',
            description: 'Triggered when auto-send is resumed',
          },
          {
            value: 'daily_limit_reached',
            label: 'Daily Limit Reached',
            description: 'Triggered when daily limit is reached',
          },
          { value: 'error', label: 'Error', description: 'Triggered when an error occurs' },
          {
            value: 'milestone',
            label: 'Milestone',
            description: 'Triggered when a milestone is reached',
          },
        ];
      }

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
          errors,
        };
      }
    };

    webhookManager = new WebhookManager();
    await webhookManager.loadWebhooks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Webhook CRUD Operations', () => {
    test('should add a new webhook', async () => {
      const webhook = {
        name: 'Test Webhook',
        url: 'https://example.com/webhook',
        events: ['message_sent'],
      };

      const created = await webhookManager.addWebhook(webhook);

      expect(created).toMatchObject({
        name: 'Test Webhook',
        url: 'https://example.com/webhook',
        events: ['message_sent'],
        enabled: true,
      });
      expect(created.id).toBeDefined();
      expect(created.createdAt).toBeDefined();
      expect(created.triggerCount).toBe(0);
      expect(created.failureCount).toBe(0);
    });

    test('should throw error for invalid webhook URL', async () => {
      const webhook = {
        name: 'Invalid Webhook',
        url: 'not-a-url',
        events: ['message_sent'],
      };

      await expect(webhookManager.addWebhook(webhook)).rejects.toThrow('Invalid webhook URL');
    });

    test('should enforce maximum webhook limit', async () => {
      webhookManager.maxWebhooks = 2;

      await webhookManager.addWebhook({
        name: 'Webhook 1',
        url: 'https://example.com/webhook1',
        events: ['message_sent'],
      });

      await webhookManager.addWebhook({
        name: 'Webhook 2',
        url: 'https://example.com/webhook2',
        events: ['message_sent'],
      });

      await expect(
        webhookManager.addWebhook({
          name: 'Webhook 3',
          url: 'https://example.com/webhook3',
          events: ['message_sent'],
        })
      ).rejects.toThrow('Maximum of 2 webhooks allowed');
    });

    test('should update an existing webhook', async () => {
      const webhook = await webhookManager.addWebhook({
        name: 'Test Webhook',
        url: 'https://example.com/webhook',
        events: ['message_sent'],
      });

      const updated = await webhookManager.updateWebhook(webhook.id, {
        name: 'Updated Webhook',
        events: ['message_sent', 'error'],
      });

      expect(updated.name).toBe('Updated Webhook');
      expect(updated.events).toEqual(['message_sent', 'error']);
      expect(updated.url).toBe('https://example.com/webhook');
    });

    test('should throw error when updating non-existent webhook', async () => {
      await expect(
        webhookManager.updateWebhook('non-existent-id', { name: 'Updated' })
      ).rejects.toThrow('Webhook not found');
    });

    test('should delete a webhook', async () => {
      const webhook = await webhookManager.addWebhook({
        name: 'Test Webhook',
        url: 'https://example.com/webhook',
        events: ['message_sent'],
      });

      await webhookManager.deleteWebhook(webhook.id);

      expect(webhookManager.getWebhooks()).toHaveLength(0);
    });

    test('should throw error when deleting non-existent webhook', async () => {
      await expect(webhookManager.deleteWebhook('non-existent-id')).rejects.toThrow(
        'Webhook not found'
      );
    });

    test('should get all webhooks', async () => {
      await webhookManager.addWebhook({
        name: 'Webhook 1',
        url: 'https://example.com/webhook1',
        events: ['message_sent'],
      });

      await webhookManager.addWebhook({
        name: 'Webhook 2',
        url: 'https://example.com/webhook2',
        events: ['error'],
      });

      const webhooks = webhookManager.getWebhooks();
      expect(webhooks).toHaveLength(2);
      expect(webhooks[0].name).toBe('Webhook 1');
      expect(webhooks[1].name).toBe('Webhook 2');
    });

    test('should get a specific webhook', async () => {
      const webhook = await webhookManager.addWebhook({
        name: 'Test Webhook',
        url: 'https://example.com/webhook',
        events: ['message_sent'],
      });

      const found = webhookManager.getWebhook(webhook.id);
      expect(found).toEqual(webhook);
    });
  });

  describe('Webhook Triggering', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
      });
    });

    test('should trigger webhooks for matching event', async () => {
      await webhookManager.addWebhook({
        name: 'Test Webhook',
        url: 'https://example.com/webhook',
        events: ['message_sent'],
      });

      await webhookManager.trigger('message_sent', { message: 'Hello' });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/webhook',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: expect.stringContaining('message_sent'),
        })
      );
    });

    test('should not trigger webhooks for non-matching events', async () => {
      await webhookManager.addWebhook({
        name: 'Test Webhook',
        url: 'https://example.com/webhook',
        events: ['error'],
      });

      await webhookManager.trigger('message_sent', { message: 'Hello' });

      expect(mockFetch).not.toHaveBeenCalled();
    });

    test('should not trigger disabled webhooks', async () => {
      await webhookManager.addWebhook({
        name: 'Test Webhook',
        url: 'https://example.com/webhook',
        events: ['message_sent'],
        enabled: false,
      });

      await webhookManager.trigger('message_sent', { message: 'Hello' });

      expect(mockFetch).not.toHaveBeenCalled();
    });

    test('should not trigger webhooks when globally disabled', async () => {
      await webhookManager.addWebhook({
        name: 'Test Webhook',
        url: 'https://example.com/webhook',
        events: ['message_sent'],
      });

      await webhookManager.setEnabled(false);
      await webhookManager.trigger('message_sent', { message: 'Hello' });

      expect(mockFetch).not.toHaveBeenCalled();
    });

    test('should include correct payload structure', async () => {
      await webhookManager.addWebhook({
        name: 'Test Webhook',
        url: 'https://example.com/webhook',
        events: ['message_sent'],
      });

      await webhookManager.trigger('message_sent', { message: 'Hello', count: 5 });

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body).toMatchObject({
        event: 'message_sent',
        data: { message: 'Hello', count: 5 },
        source: 'AutoChat',
      });
      expect(body.timestamp).toBeDefined();
      expect(body.version).toBeDefined();
    });

    test('should update webhook statistics on success', async () => {
      const webhook = await webhookManager.addWebhook({
        name: 'Test Webhook',
        url: 'https://example.com/webhook',
        events: ['message_sent'],
      });

      await webhookManager.trigger('message_sent', { message: 'Hello' });

      const updated = webhookManager.getWebhook(webhook.id);
      expect(updated.triggerCount).toBe(1);
      expect(updated.lastTriggered).toBeDefined();
      expect(updated.failureCount).toBe(0);
    });

    test('should retry on failure', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ ok: true, status: 200, statusText: 'OK' });

      await webhookManager.addWebhook({
        name: 'Test Webhook',
        url: 'https://example.com/webhook',
        events: ['message_sent'],
      });

      await webhookManager.trigger('message_sent', { message: 'Hello' });

      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    test('should increment failure count after all retries fail', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const webhook = await webhookManager.addWebhook({
        name: 'Test Webhook',
        url: 'https://example.com/webhook',
        events: ['message_sent'],
      });

      webhookManager.retryAttempts = 2;
      await webhookManager.trigger('message_sent', { message: 'Hello' });

      const updated = webhookManager.getWebhook(webhook.id);
      expect(updated.failureCount).toBe(1);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    test('should handle multiple webhooks for same event', async () => {
      await webhookManager.addWebhook({
        name: 'Webhook 1',
        url: 'https://example.com/webhook1',
        events: ['message_sent'],
      });

      await webhookManager.addWebhook({
        name: 'Webhook 2',
        url: 'https://example.com/webhook2',
        events: ['message_sent'],
      });

      await webhookManager.trigger('message_sent', { message: 'Hello' });

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenCalledWith('https://example.com/webhook1', expect.any(Object));
      expect(mockFetch).toHaveBeenCalledWith('https://example.com/webhook2', expect.any(Object));
    });

    test('should include custom headers in webhook request', async () => {
      await webhookManager.addWebhook({
        name: 'Test Webhook',
        url: 'https://example.com/webhook',
        events: ['message_sent'],
        headers: {
          Authorization: 'Bearer token123',
          'X-Custom-Header': 'custom-value',
        },
      });

      await webhookManager.trigger('message_sent', { message: 'Hello' });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/webhook',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer token123',
            'X-Custom-Header': 'custom-value',
          }),
        })
      );
    });
  });

  describe('Webhook Testing', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
      });
    });

    test('should test a webhook', async () => {
      const webhook = await webhookManager.addWebhook({
        name: 'Test Webhook',
        url: 'https://example.com/webhook',
        events: ['message_sent'],
      });

      const result = await webhookManager.testWebhook(webhook.id);

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/webhook',
        expect.objectContaining({
          body: expect.stringContaining('"test":true'),
        })
      );
    });

    test('should throw error when testing non-existent webhook', async () => {
      await expect(webhookManager.testWebhook('non-existent-id')).rejects.toThrow(
        'Webhook not found'
      );
    });
  });

  describe('Webhook Statistics', () => {
    test('should get webhook statistics', async () => {
      await webhookManager.addWebhook({
        name: 'Webhook 1',
        url: 'https://example.com/webhook1',
        events: ['message_sent'],
        enabled: true,
      });

      await webhookManager.addWebhook({
        name: 'Webhook 2',
        url: 'https://example.com/webhook2',
        events: ['error'],
        enabled: false,
      });

      const stats = webhookManager.getStats();

      expect(stats).toEqual({
        total: 2,
        enabled: 1,
        disabled: 1,
        totalTriggers: 0,
        totalFailures: 0,
      });
    });

    test('should clear webhook statistics', async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200, statusText: 'OK' });

      const webhook = await webhookManager.addWebhook({
        name: 'Test Webhook',
        url: 'https://example.com/webhook',
        events: ['message_sent'],
      });

      await webhookManager.trigger('message_sent', { message: 'Hello' });

      let updated = webhookManager.getWebhook(webhook.id);
      expect(updated.triggerCount).toBe(1);

      await webhookManager.clearStats(webhook.id);

      updated = webhookManager.getWebhook(webhook.id);
      expect(updated.triggerCount).toBe(0);
      expect(updated.lastTriggered).toBeNull();
    });

    test('should clear all webhook statistics', async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200, statusText: 'OK' });

      await webhookManager.addWebhook({
        name: 'Webhook 1',
        url: 'https://example.com/webhook1',
        events: ['message_sent'],
      });

      await webhookManager.addWebhook({
        name: 'Webhook 2',
        url: 'https://example.com/webhook2',
        events: ['message_sent'],
      });

      await webhookManager.trigger('message_sent', { message: 'Hello' });
      await webhookManager.clearStats();

      const stats = webhookManager.getStats();
      expect(stats.totalTriggers).toBe(0);
    });
  });

  describe('Webhook Validation', () => {
    test('should validate webhook with all required fields', () => {
      const webhook = {
        name: 'Test Webhook',
        url: 'https://example.com/webhook',
        events: ['message_sent'],
      };

      const result = WebhookManager.validate(webhook);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should fail validation for missing name', () => {
      const webhook = {
        url: 'https://example.com/webhook',
        events: ['message_sent'],
      };

      const result = WebhookManager.validate(webhook);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Name is required');
    });

    test('should fail validation for invalid URL', () => {
      const webhook = {
        name: 'Test Webhook',
        url: 'not-a-url',
        events: ['message_sent'],
      };

      const result = WebhookManager.validate(webhook);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Valid URL is required (must start with http:// or https://)'
      );
    });

    test('should fail validation for missing events', () => {
      const webhook = {
        name: 'Test Webhook',
        url: 'https://example.com/webhook',
        events: [],
      };

      const result = WebhookManager.validate(webhook);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('At least one event must be selected');
    });

    test('should fail validation for invalid HTTP method', () => {
      const webhook = {
        name: 'Test Webhook',
        url: 'https://example.com/webhook',
        events: ['message_sent'],
        method: 'INVALID',
      };

      const result = WebhookManager.validate(webhook);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid HTTP method');
    });
  });

  describe('Event Types', () => {
    test('should return supported event types', () => {
      const eventTypes = WebhookManager.getEventTypes();

      expect(eventTypes).toBeInstanceOf(Array);
      expect(eventTypes.length).toBeGreaterThan(0);

      const messageSentEvent = eventTypes.find((e) => e.value === 'message_sent');
      expect(messageSentEvent).toBeDefined();
      expect(messageSentEvent.label).toBe('Message Sent');
      expect(messageSentEvent.description).toBeDefined();
    });
  });

  describe('Enable/Disable', () => {
    test('should enable/disable webhooks globally', async () => {
      await webhookManager.setEnabled(false);
      expect(webhookManager.enabled).toBe(false);

      await webhookManager.setEnabled(true);
      expect(webhookManager.enabled).toBe(true);
    });

    test('should enable/disable specific webhook', async () => {
      const webhook = await webhookManager.addWebhook({
        name: 'Test Webhook',
        url: 'https://example.com/webhook',
        events: ['message_sent'],
      });

      await webhookManager.setWebhookEnabled(webhook.id, false);

      const updated = webhookManager.getWebhook(webhook.id);
      expect(updated.enabled).toBe(false);
    });

    test('should throw error when enabling non-existent webhook', async () => {
      await expect(webhookManager.setWebhookEnabled('non-existent-id', true)).rejects.toThrow(
        'Webhook not found'
      );
    });
  });
});
