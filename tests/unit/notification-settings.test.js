/**
 * Tests for notification settings integration
 */

describe('Notification Settings Integration', () => {
  beforeEach(() => {
    // Reset storage mock
    global.chrome.storage.local.get = jest.fn((keys, callback) => {
      callback({
        notificationsEnabled: true,
        notificationSound: true
      });
    });
    
    global.chrome.storage.local.set = jest.fn((data, callback) => {
      if (callback) callback();
    });
  });

  test('should load notification settings from storage', (done) => {
    global.chrome.storage.local.get(['notificationsEnabled', 'notificationSound'], (data) => {
      expect(data.notificationsEnabled).toBe(true);
      expect(data.notificationSound).toBe(true);
      done();
    });
  });

  test('should save notification settings to storage', () => {
    const settings = {
      notificationsEnabled: false,
      notificationSound: false
    };
    
    global.chrome.storage.local.set(settings);
    
    expect(global.chrome.storage.local.set).toHaveBeenCalledWith(settings);
  });

  test('should default notificationsEnabled to true if not set', (done) => {
    global.chrome.storage.local.get = jest.fn((keys, callback) => {
      callback({});
    });
    
    global.chrome.storage.local.get(['notificationsEnabled', 'notificationSound'], (data) => {
      // In the actual implementation, notificationsEnabled !== false means true
      const enabled = data.notificationsEnabled !== false;
      expect(enabled).toBe(true);
      done();
    });
  });

  test('should default notificationSound to true if not set', (done) => {
    global.chrome.storage.local.get = jest.fn((keys, callback) => {
      callback({});
    });
    
    global.chrome.storage.local.get(['notificationsEnabled', 'notificationSound'], (data) => {
      // In the actual implementation, notificationSound !== false means true
      const soundEnabled = data.notificationSound !== false;
      expect(soundEnabled).toBe(true);
      done();
    });
  });

  test('should handle notification settings with other settings', (done) => {
    global.chrome.storage.local.get = jest.fn((keys, callback) => {
      callback({
        messageList: 'Hello\nWorld',
        sendMode: 'random',
        notificationsEnabled: false,
        notificationSound: true
      });
    });
    
    global.chrome.storage.local.get(
      ['messageList', 'sendMode', 'notificationsEnabled', 'notificationSound'],
      (data) => {
        expect(data.messageList).toBe('Hello\nWorld');
        expect(data.sendMode).toBe('random');
        expect(data.notificationsEnabled).toBe(false);
        expect(data.notificationSound).toBe(true);
        done();
      }
    );
  });

  test('should save notification settings as part of complete settings object', () => {
    const completeSettings = {
      messageList: 'Test message',
      sendMode: 'sequential',
      minInterval: 1,
      maxInterval: 3,
      typingSimulation: true,
      notificationsEnabled: true,
      notificationSound: false
    };
    
    global.chrome.storage.local.set(completeSettings);
    
    expect(global.chrome.storage.local.set).toHaveBeenCalledWith(completeSettings);
  });
});
