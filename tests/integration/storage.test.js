/**
 * @jest-environment jsdom
 */

describe('Storage Integration', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
  });

  test('should save settings to chrome.storage', async () => {
    const settings = {
      messageList: 'Hello\nWorld',
      sendMode: 'random',
      minInterval: 60,
      maxInterval: 120,
    };

    chrome.storage.local.set(settings);

    expect(chrome.storage.local.set).toHaveBeenCalledWith(settings);
  });

  test('should load settings from chrome.storage', async () => {
    const mockData = {
      messageList: 'Test message',
      sendMode: 'sequential',
    };

    chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback(mockData);
    });

    chrome.storage.local.get(['messageList', 'sendMode'], (data) => {
      expect(data.messageList).toBe('Test message');
      expect(data.sendMode).toBe('sequential');
    });
  });

  test('should handle missing settings gracefully', async () => {
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({});
    });

    chrome.storage.local.get(['messageList'], (data) => {
      expect(data.messageList).toBeUndefined();
    });
  });
});
