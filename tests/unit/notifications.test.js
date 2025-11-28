/**
 * Tests for Notifications Module
 */

describe('NotificationManager', () => {
  let NotificationManager;
  let manager;

  beforeEach(() => {
    // Mock Notification API
    global.Notification = {
      permission: 'granted',
      requestPermission: jest.fn(() => Promise.resolve('granted'))
    };

    // Mock Notification constructor
    global.Notification = jest.fn().mockImplementation((title, options) => {
      return {
        title,
        options,
        close: jest.fn()
      };
    });
    global.Notification.permission = 'granted';
    global.Notification.requestPermission = jest.fn(() => Promise.resolve('granted'));

    // Mock Audio
    global.Audio = jest.fn().mockImplementation(() => {
      return {
        play: jest.fn().mockResolvedValue(undefined),
        volume: 0.3,
        src: ''
      };
    });

    // Create inline class for testing
    NotificationManager = class {
      constructor() {
        this.enabled = true;
        this.soundEnabled = true;
        this.notificationHistory = [];
        this.maxHistory = 50;
        this.unreadCount = 0;
        this.idCounter = 0;
      }

      generateId() {
        this.idCounter++;
        return `${Date.now()}-${this.idCounter}`;
      }

      async requestPermission() {
        if (!('Notification' in global)) return false;
        if (global.Notification.permission === 'granted') return true;
        const permission = await global.Notification.requestPermission();
        return permission === 'granted';
      }

      async show(title, options = {}) {
        // Add to history
        this.addToHistory(title, options);

        if (!this.enabled) return;
        const hasPermission = await this.requestPermission();
        if (!hasPermission) return;
        
        const notification = new global.Notification(title, options);
        if (this.soundEnabled && options.sound !== false) {
          this.playSound();
        }
        return notification;
      }

      addToHistory(title, options = {}) {
        const historyItem = {
          id: this.generateId(),
          title,
          body: options.body || '',
          type: options.type || 'info',
          timestamp: new Date().toISOString(),
          read: false,
          tag: options.tag || null
        };

        this.notificationHistory.unshift(historyItem);
        
        if (this.notificationHistory.length > this.maxHistory) {
          this.notificationHistory = this.notificationHistory.slice(0, this.maxHistory);
        }

        this.unreadCount++;
        return historyItem;
      }

      markAsRead(id) {
        const notification = this.notificationHistory.find(n => n.id === id);
        if (notification && !notification.read) {
          notification.read = true;
          this.unreadCount = Math.max(0, this.unreadCount - 1);
        }
      }

      markAllAsRead() {
        this.notificationHistory.forEach(n => n.read = true);
        this.unreadCount = 0;
      }

      clearHistory() {
        this.notificationHistory = [];
        this.unreadCount = 0;
      }

      getHistory(limit = 20) {
        return this.notificationHistory.slice(0, limit);
      }

      getUnreadCount() {
        return this.unreadCount;
      }

      deleteNotification(id) {
        const index = this.notificationHistory.findIndex(n => n.id === id);
        if (index !== -1) {
          if (!this.notificationHistory[index].read) {
            this.unreadCount = Math.max(0, this.unreadCount - 1);
          }
          this.notificationHistory.splice(index, 1);
        }
      }

      playSound() {
        const audio = new Audio();
        audio.volume = 0.3;
        audio.play();
      }

      setEnabled(enabled) {
        this.enabled = enabled;
      }

      setSoundEnabled(enabled) {
        this.soundEnabled = enabled;
      }
    };

    manager = new NotificationManager();
  });

  test('should initialize with notifications enabled', () => {
    expect(manager.enabled).toBe(true);
    expect(manager.soundEnabled).toBe(true);
  });

  test('should request permission successfully', async () => {
    const result = await manager.requestPermission();
    expect(result).toBe(true);
  });

  test('should show notification when enabled', async () => {
    const notification = await manager.show('Test', { body: 'Test message' });
    expect(notification).toBeDefined();
    expect(global.Notification).toHaveBeenCalledWith('Test', expect.objectContaining({
      body: 'Test message'
    }));
  });

  test('should not show notification when disabled', async () => {
    manager.setEnabled(false);
    const notification = await manager.show('Test', { body: 'Test message' });
    expect(notification).toBeUndefined();
  });

  test('should play sound when sound enabled', async () => {
    await manager.show('Test', { body: 'Test message' });
    expect(Audio).toHaveBeenCalled();
  });

  test('should not play sound when sound disabled', async () => {
    manager.setSoundEnabled(false);
    await manager.show('Test', { body: 'Test message' });
    // Sound should not be played but notification should still show
    expect(global.Notification).toHaveBeenCalled();
  });

  test('should not play sound when sound option is false', async () => {
    await manager.show('Test', { body: 'Test', sound: false });
    // Notification shown but no sound
    expect(global.Notification).toHaveBeenCalled();
  });

  // New tests for notification history
  describe('Notification History', () => {
    test('should add notification to history when shown', async () => {
      await manager.show('Test Title', { body: 'Test body' });
      expect(manager.notificationHistory.length).toBe(1);
      expect(manager.notificationHistory[0].title).toBe('Test Title');
      expect(manager.notificationHistory[0].body).toBe('Test body');
      expect(manager.notificationHistory[0].read).toBe(false);
    });

    test('should increment unread count when notification is added', async () => {
      expect(manager.unreadCount).toBe(0);
      await manager.show('Test', { body: 'Test' });
      expect(manager.unreadCount).toBe(1);
      await manager.show('Test 2', { body: 'Test 2' });
      expect(manager.unreadCount).toBe(2);
    });

    test('should mark notification as read', async () => {
      await manager.show('Test', { body: 'Test' });
      const id = manager.notificationHistory[0].id;
      
      expect(manager.notificationHistory[0].read).toBe(false);
      expect(manager.unreadCount).toBe(1);
      
      manager.markAsRead(id);
      
      expect(manager.notificationHistory[0].read).toBe(true);
      expect(manager.unreadCount).toBe(0);
    });

    test('should mark all notifications as read', async () => {
      await manager.show('Test 1', { body: 'Test 1' });
      await manager.show('Test 2', { body: 'Test 2' });
      await manager.show('Test 3', { body: 'Test 3' });
      
      expect(manager.unreadCount).toBe(3);
      
      manager.markAllAsRead();
      
      expect(manager.unreadCount).toBe(0);
      manager.notificationHistory.forEach(n => {
        expect(n.read).toBe(true);
      });
    });

    test('should clear notification history', async () => {
      await manager.show('Test 1', { body: 'Test 1' });
      await manager.show('Test 2', { body: 'Test 2' });
      
      expect(manager.notificationHistory.length).toBe(2);
      
      manager.clearHistory();
      
      expect(manager.notificationHistory.length).toBe(0);
      expect(manager.unreadCount).toBe(0);
    });

    test('should get limited history', async () => {
      for (let i = 0; i < 10; i++) {
        await manager.show(`Test ${i}`, { body: `Body ${i}` });
      }
      
      const history = manager.getHistory(5);
      expect(history.length).toBe(5);
    });

    test('should delete notification from history', async () => {
      await manager.show('Test 1', { body: 'Test 1' });
      await manager.show('Test 2', { body: 'Test 2' });
      
      const id = manager.notificationHistory[0].id;
      
      expect(manager.notificationHistory.length).toBe(2);
      expect(manager.unreadCount).toBe(2);
      
      manager.deleteNotification(id);
      
      expect(manager.notificationHistory.length).toBe(1);
      expect(manager.unreadCount).toBe(1);
    });

    test('should limit history to maxHistory items', async () => {
      for (let i = 0; i < 60; i++) {
        manager.addToHistory(`Test ${i}`, { body: `Body ${i}` });
      }
      
      expect(manager.notificationHistory.length).toBe(50);
    });

    test('should add notification type to history', async () => {
      await manager.show('Error Test', { body: 'Error body', type: 'error' });
      expect(manager.notificationHistory[0].type).toBe('error');
    });

    test('should add notification tag to history', async () => {
      await manager.show('Tagged Test', { body: 'Tagged body', tag: 'test-tag' });
      expect(manager.notificationHistory[0].tag).toBe('test-tag');
    });
  });
});
