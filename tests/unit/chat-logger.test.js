/* chat-logger.test.js — Tests for Chat Logger */

describe('ChatLogger', () => {
  let ChatLogger;
  let logger;

  beforeEach(() => {
    // Mock DOM
    document.body.innerHTML = '<div id="chat-container"></div>';

    // Import the module
    ChatLogger = require('../../src/chat-logger');
    logger = new ChatLogger();

    // Mock chrome.storage
    global.chrome.storage.local.get = jest.fn((keys, callback) => {
      callback({ chatLogs: [] });
      return Promise.resolve({ chatLogs: [] });
    });

    global.chrome.storage.local.set = jest.fn((items, callback) => {
      if (callback) callback();
      return Promise.resolve();
    });
  });

  afterEach(() => {
    if (logger.isLogging) {
      logger.stopLogging();
    }
  });

  describe('startLogging', () => {
    test('should start logging with valid container', async () => {
      const container = document.getElementById('chat-container');
      await logger.startLogging('#chat-container');

      expect(logger.isLogging).toBe(true);
      expect(logger.observer).not.toBeNull();
    });

    test('should not start logging with invalid container', async () => {
      await logger.startLogging('#nonexistent');

      expect(logger.isLogging).toBe(false);
      expect(logger.observer).toBeNull();
    });

    test('should not start if already logging', async () => {
      await logger.startLogging('#chat-container');
      const firstObserver = logger.observer;

      await logger.startLogging('#chat-container');

      expect(logger.observer).toBe(firstObserver);
    });
  });

  describe('stopLogging', () => {
    test('should stop logging and clean up', async () => {
      await logger.startLogging('#chat-container');
      logger.stopLogging();

      expect(logger.isLogging).toBe(false);
      expect(logger.observer).toBeNull();
      expect(logger.flushInterval).toBeNull();
    });

    test('should handle stop when not logging', () => {
      expect(() => logger.stopLogging()).not.toThrow();
    });
  });

  describe('extractMessageFromElement', () => {
    test('should extract message from element', () => {
      const messageEl = document.createElement('div');
      messageEl.className = 'message';
      messageEl.textContent = 'Hello World';

      const message = logger.extractMessageFromElement(messageEl);

      expect(message).not.toBeNull();
      expect(message.text).toBe('Hello World');
      expect(message.timestamp).toBeDefined();
    });

    test('should return null for empty text', () => {
      const messageEl = document.createElement('div');
      messageEl.className = 'message';

      const message = logger.extractMessageFromElement(messageEl);

      expect(message).toBeNull();
    });

    test('should limit message length', () => {
      const longText = 'a'.repeat(2000);
      const messageEl = document.createElement('div');
      messageEl.className = 'message';
      messageEl.textContent = longText;

      const message = logger.extractMessageFromElement(messageEl);

      expect(message.text.length).toBe(1000);
    });
  });

  describe('detectMessageDirection', () => {
    test('should detect outgoing messages', () => {
      const el = document.createElement('div');
      el.className = 'message outgoing';

      const direction = logger.detectMessageDirection(el);

      expect(direction).toBe('outgoing');
    });

    test('should detect incoming messages', () => {
      const el = document.createElement('div');
      el.className = 'message incoming';

      const direction = logger.detectMessageDirection(el);

      expect(direction).toBe('incoming');
    });

    test('should return unknown for ambiguous messages', () => {
      const el = document.createElement('div');
      el.className = 'message';

      const direction = logger.detectMessageDirection(el);

      expect(direction).toBe('unknown');
    });
  });

  describe('detectPlatform', () => {
    test('should detect WhatsApp', () => {
      Object.defineProperty(window, 'location', {
        value: {
          href: 'https://web.whatsapp.com/',
          hostname: 'web.whatsapp.com',
        },
        writable: true,
      });

      const platform = logger.detectPlatform();

      expect(platform).toBe('WhatsApp');
    });

    test('should detect Discord', () => {
      Object.defineProperty(window, 'location', {
        value: {
          href: 'https://discord.com/channels/123',
          hostname: 'discord.com',
        },
        writable: true,
      });

      const platform = logger.detectPlatform();

      expect(platform).toBe('Discord');
    });

    test('should return Unknown for unrecognized platforms', () => {
      Object.defineProperty(window, 'location', {
        value: {
          href: 'https://example.com',
          hostname: 'example.com',
        },
        writable: true,
      });

      const platform = logger.detectPlatform();

      expect(platform).toBe('Unknown');
    });
  });

  describe('saveMessages', () => {
    test('should save messages to storage', async () => {
      const messages = [
        { id: '1', text: 'Test 1', timestamp: new Date().toISOString() },
        { id: '2', text: 'Test 2', timestamp: new Date().toISOString() },
      ];

      await logger.saveMessages(messages);

      expect(chrome.storage.local.set).toHaveBeenCalled();
    });

    test('should enforce max message limit', async () => {
      logger.maxMessages = 5;

      // Pre-fill storage
      const existingMessages = Array.from({ length: 10 }, (_, i) => ({
        id: `old_${i}`,
        text: `Old message ${i}`,
        timestamp: new Date().toISOString(),
      }));

      global.chrome.storage.local.get = jest.fn((keys, callback) => {
        callback({ chatLogs: existingMessages });
      });

      const newMessages = [
        { id: 'new_1', text: 'New message', timestamp: new Date().toISOString() },
      ];

      await logger.saveMessages(newMessages);

      const savedData = chrome.storage.local.set.mock.calls[0][0];
      expect(savedData.chatLogs.length).toBeLessThanOrEqual(logger.maxMessages);
    });
  });

  describe('getMessages', () => {
    test('should retrieve all messages', async () => {
      const testMessages = [
        { id: '1', text: 'Test 1', sender: 'User1', timestamp: new Date().toISOString() },
        { id: '2', text: 'Test 2', sender: 'User2', timestamp: new Date().toISOString() },
      ];

      global.chrome.storage.local.get = jest.fn((keys, callback) => {
        callback({ chatLogs: testMessages });
      });

      const messages = await logger.getMessages();

      expect(messages).toHaveLength(2);
    });

    test('should filter by search query', async () => {
      const testMessages = [
        { id: '1', text: 'Hello World', sender: 'User1', timestamp: new Date().toISOString() },
        { id: '2', text: 'Goodbye', sender: 'User2', timestamp: new Date().toISOString() },
      ];

      global.chrome.storage.local.get = jest.fn((keys, callback) => {
        callback({ chatLogs: testMessages });
      });

      const messages = await logger.getMessages({ search: 'Hello' });

      expect(messages).toHaveLength(1);
      expect(messages[0].text).toBe('Hello World');
    });

    test('should filter by date range', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const testMessages = [
        { id: '1', text: 'Recent', sender: 'User1', timestamp: now.toISOString() },
        { id: '2', text: 'Old', sender: 'User2', timestamp: yesterday.toISOString() },
      ];

      global.chrome.storage.local.get = jest.fn((keys, callback) => {
        callback({ chatLogs: testMessages });
      });

      const messages = await logger.getMessages({
        startDate: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
      });

      expect(messages).toHaveLength(1);
      expect(messages[0].text).toBe('Recent');
    });

    test('should apply pagination', async () => {
      const testMessages = Array.from({ length: 10 }, (_, i) => ({
        id: `${i}`,
        text: `Message ${i}`,
        sender: 'User1',
        timestamp: new Date().toISOString(),
      }));

      global.chrome.storage.local.get = jest.fn((keys, callback) => {
        callback({ chatLogs: testMessages });
      });

      const messages = await logger.getMessages({ limit: 3, offset: 2 });

      expect(messages).toHaveLength(3);
    });
  });

  describe('getStats', () => {
    test('should calculate statistics', async () => {
      const testMessages = [
        {
          id: '1',
          text: 'Test 1',
          sender: 'User1',
          direction: 'incoming',
          platform: 'WhatsApp',
          timestamp: new Date().toISOString(),
        },
        {
          id: '2',
          text: 'Test 2',
          sender: 'User1',
          direction: 'outgoing',
          platform: 'WhatsApp',
          timestamp: new Date().toISOString(),
        },
        {
          id: '3',
          text: 'Test 3',
          sender: 'User2',
          direction: 'incoming',
          platform: 'Discord',
          timestamp: new Date().toISOString(),
        },
      ];

      global.chrome.storage.local.get = jest.fn((keys, callback) => {
        callback({ chatLogs: testMessages });
      });

      const stats = await logger.getStats();

      expect(stats.total).toBe(3);
      expect(stats.incoming).toBe(2);
      expect(stats.outgoing).toBe(1);
      expect(stats.platforms.WhatsApp).toBe(2);
      expect(stats.platforms.Discord).toBe(1);
      expect(stats.senders.User1).toBe(2);
      expect(stats.senders.User2).toBe(1);
    });
  });

  describe('clearLogs', () => {
    test('should clear all logs', async () => {
      await logger.clearLogs();

      expect(chrome.storage.local.set).toHaveBeenCalledWith({ chatLogs: [] }, expect.any(Function));
    });
  });

  describe('exportToJSON', () => {
    test('should export messages as JSON', async () => {
      const testMessages = [
        { id: '1', text: 'Test', sender: 'User1', timestamp: new Date().toISOString() },
      ];

      global.chrome.storage.local.get = jest.fn((keys, callback) => {
        callback({ chatLogs: testMessages });
      });

      const json = await logger.exportToJSON();
      const parsed = JSON.parse(json);

      expect(parsed.messages).toHaveLength(1);
      expect(parsed.stats).toBeDefined();
      expect(parsed.exportDate).toBeDefined();
    });
  });

  describe('exportToCSV', () => {
    test('should export messages as CSV', async () => {
      const testMessages = [
        {
          id: '1',
          text: 'Test',
          sender: 'User1',
          direction: 'outgoing',
          platform: 'WhatsApp',
          timestamp: new Date().toISOString(),
        },
      ];

      global.chrome.storage.local.get = jest.fn((keys, callback) => {
        callback({ chatLogs: testMessages });
      });

      const csv = await logger.exportToCSV();

      expect(csv).toContain('ID,Timestamp,Sender');
      expect(csv).toContain('Test');
    });

    test('should escape quotes in CSV', async () => {
      const testMessages = [
        {
          id: '1',
          text: 'He said "hello"',
          sender: 'User1',
          direction: 'outgoing',
          platform: 'WhatsApp',
          timestamp: new Date().toISOString(),
        },
      ];

      global.chrome.storage.local.get = jest.fn((keys, callback) => {
        callback({ chatLogs: testMessages });
      });

      const csv = await logger.exportToCSV();

      expect(csv).toContain('""hello""');
    });
  });
});
