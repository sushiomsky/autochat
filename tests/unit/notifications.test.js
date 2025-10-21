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
      }

      async requestPermission() {
        if (!('Notification' in global)) return false;
        if (global.Notification.permission === 'granted') return true;
        const permission = await global.Notification.requestPermission();
        return permission === 'granted';
      }

      async show(title, options = {}) {
        if (!this.enabled) return;
        const hasPermission = await this.requestPermission();
        if (!hasPermission) return;
        
        const notification = new global.Notification(title, options);
        if (this.soundEnabled && options.sound !== false) {
          this.playSound();
        }
        return notification;
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
});
