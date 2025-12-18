/**
 * Browser Notifications Module
 * Handles desktop notifications for events and in-app notification center
 */

export class NotificationManager {
  constructor() {
    this.enabled = true;
    this.soundEnabled = true;
    this.notificationHistory = [];
    this.maxHistory = 50;
    this.unreadCount = 0;
    this.idCounter = 0;
    this.loadSettings();
  }

  /**
   * Load notification settings from storage
   */
  async loadSettings() {
    const data = await chrome.storage.local.get([
      'notificationsEnabled',
      'notificationSound',
      'notificationHistory',
      'unreadCount',
    ]);
    this.enabled = data.notificationsEnabled !== false;
    this.soundEnabled = data.notificationSound !== false;
    this.notificationHistory = data.notificationHistory || [];
    this.unreadCount = data.unreadCount || 0;
  }

  /**
   * Save notification history to storage
   */
  async saveHistory() {
    await chrome.storage.local.set({
      notificationHistory: this.notificationHistory,
      unreadCount: this.unreadCount,
    });
  }

  /**
   * Request notification permission
   * @returns {Promise<boolean>} Permission granted
   */
  async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('Browser notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  /**
   * Show a notification
   * @param {string} title - Notification title
   * @param {object} options - Notification options
   */
  async show(title, options = {}) {
    // Add to history
    this.addToHistory(title, options);

    if (!this.enabled) return;

    const hasPermission = await this.requestPermission();
    if (!hasPermission) return;

    const notification = new Notification(title, {
      icon: chrome.runtime.getURL('icon48.png'),
      badge: chrome.runtime.getURL('icon16.png'),
      ...options,
    });

    // Auto-close after 5 seconds
    setTimeout(() => notification.close(), 5000);

    // Play sound if enabled
    if (this.soundEnabled && options.sound !== false) {
      this.playSound();
    }

    return notification;
  }

  /**
   * Generate unique ID for notifications
   * Uses timestamp + counter to avoid collisions
   */
  generateId() {
    this.idCounter++;
    return `${Date.now()}-${this.idCounter}`;
  }

  /**
   * Add notification to history
   * @param {string} title - Notification title
   * @param {object} options - Notification options
   */
  addToHistory(title, options = {}) {
    const historyItem = {
      id: this.generateId(),
      title,
      body: options.body || '',
      type: options.type || 'info',
      timestamp: new Date().toISOString(),
      read: false,
      tag: options.tag || null,
    };

    this.notificationHistory.unshift(historyItem);

    // Keep only maxHistory items
    if (this.notificationHistory.length > this.maxHistory) {
      this.notificationHistory = this.notificationHistory.slice(0, this.maxHistory);
    }

    this.unreadCount++;
    this.saveHistory();
    return historyItem;
  }

  /**
   * Mark notification as read
   * @param {number} id - Notification ID
   */
  markAsRead(id) {
    const notification = this.notificationHistory.find((n) => n.id === id);
    if (notification && !notification.read) {
      notification.read = true;
      this.unreadCount = Math.max(0, this.unreadCount - 1);
      this.saveHistory();
    }
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead() {
    this.notificationHistory.forEach((n) => (n.read = true));
    this.unreadCount = 0;
    this.saveHistory();
  }

  /**
   * Clear notification history
   */
  clearHistory() {
    this.notificationHistory = [];
    this.unreadCount = 0;
    this.saveHistory();
  }

  /**
   * Get notification history
   * @param {number} limit - Max items to return
   * @returns {Array} Notification history
   */
  getHistory(limit = 20) {
    return this.notificationHistory.slice(0, limit);
  }

  /**
   * Get unread count
   * @returns {number} Unread count
   */
  getUnreadCount() {
    return this.unreadCount;
  }

  /**
   * Delete a notification from history
   * @param {number} id - Notification ID
   */
  deleteNotification(id) {
    const index = this.notificationHistory.findIndex((n) => n.id === id);
    if (index !== -1) {
      if (!this.notificationHistory[index].read) {
        this.unreadCount = Math.max(0, this.unreadCount - 1);
      }
      this.notificationHistory.splice(index, 1);
      this.saveHistory();
    }
  }

  /**
   * Show message sent notification
   * @param {number} count - Number of messages sent
   */
  async notifyMessageSent(count = 1) {
    await this.show('AutoChat', {
      body: `Message${count > 1 ? 's' : ''} sent successfully! (Total: ${count})`,
      tag: 'message-sent',
      icon: chrome.runtime.getURL('icon48.png'),
    });
  }

  /**
   * Show daily limit reached notification
   * @param {number} limit - Daily limit
   */
  async notifyDailyLimitReached(limit) {
    await this.show('AutoChat - Daily Limit Reached', {
      body: `You've reached your daily limit of ${limit} messages. Auto-send stopped.`,
      tag: 'daily-limit',
      requireInteraction: true,
    });
  }

  /**
   * Show error notification
   * @param {string} message - Error message
   */
  async notifyError(message) {
    await this.show('AutoChat Error', {
      body: message,
      tag: 'error',
      requireInteraction: true,
    });
  }

  /**
   * Show auto-send started notification
   */
  async notifyAutoSendStarted() {
    await this.show('AutoChat Started', {
      body: 'Auto-send is now active',
      tag: 'auto-send-started',
    });
  }

  /**
   * Show auto-send stopped notification
   */
  async notifyAutoSendStopped() {
    await this.show('AutoChat Stopped', {
      body: 'Auto-send has been stopped',
      tag: 'auto-send-stopped',
    });
  }

  /**
   * Show achievement notification
   * @param {string} achievement - Achievement name
   * @param {string} description - Achievement description
   */
  async notifyAchievement(achievement, description) {
    await this.show(`🏆 Achievement Unlocked!`, {
      body: `${achievement}\n${description}`,
      tag: 'achievement',
      requireInteraction: true,
    });
  }

  /**
   * Play notification sound
   */
  playSound() {
    try {
      const audio = new Audio();
      audio.volume = 0.3;
      // Use a data URL for a simple beep sound
      audio.src =
        'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYHGWi77eifTRAMUKfi8LdjHAU4ktjyzHksBSN2yPDekTwKFF+z6uyoVRQLRp/h8r5sIQYtgMzy2Ik2Bxlou+3on00QDVG34vC3YhwFOJLY8s15KwUldsrw3ZE8ChRfs+rsp1UUDUZ/4fK/bSEHLYDM8tmJNgcZaLzs6J9NEA1Rt+Lxt2IcBziS2PLNeSsFJXbK8N2RPAoUX7Pq7KhVFA1Gf+HyvmwhBy2AzPLZiTYHGWi77OifTRAMUbfi8LdjHAU4ktfyzHksBSh1y/DdkTwKFF+z6+ynVRQNRp/g8r9sIQcqf8zy2Ik2Bxlou+3on0wQDVG24vC3YhwFOJPY8sx5LAYqdsrw3ZA8ChRfs+rsp1QUDUaf4PK+bCEHLX/L8tiJNgcZaLvt6J9NEAxStuLwtmIcBTiT2PLMeSwGKnbK8N2QPAoUX7Tp7KdUFA1Gn+DyvmshBy+Ay/LYiTYHGWi77eifTRAMUzfh8bZiHAU4lNjyzHksBit2yvDdkDwKFF+06eymVBQNRp/g8r5sIQYvgMry2Ik2Bxlou+3on00QDFI34fG2YhwFOJPY8sx5LAUsdsvw3JA8ChRftOnsp1QUDUaf4PK+bCEHL4DL8tiJNggZaLrt6J9NEAxTN+HxtmIcBTiU2PLMeSwGK3bL8NyQPAoUYLTp7KdUFAxGn+DyvmwhBy+Ay/LYiTYHGWi77eifTRAMUzfh8bZiHAU4lNjyzHksBSt2y/DckDwKFF+06eynVBQMR5/g8r5sIQcvgMvy2Ik2Bxlou+3on00QDFI34fG2YhwFOJTY8sx5LAUrdsvw3JA8ChRftOnsp1QUDEef4PK+bCEHL4DL8tiJNgcZaLrt6J9NEAxTN+HxtmIcBTiU2PLMeSwGK3bL8NyQPAoUX7Tq7KdUFAxHn+DyvmwhBy+Ay/LYiTYHGWi77eifTRAMUzfh8bZiHAU4lNjyzHksBit2y/DckDwKFF+06eynVBQMR5/g8r5sIQcvgMvy2Ik2Bxlou+3on00QDFI34fG2YhwFOJTY8sx5LAYrdsvw3JA8ChRftOnsp1QUDEef4PK+bCEHL4DL8tiJNgcZaLvt6J9NEAxTN+HxtmIcBTiU2PLMeSwGK3bL8NyQPAoUX7Tq7KdUFAxHn+DyvmwhBy+Ay/LYiTYHGWi77eifTRANU3fh8bZiHAQ4lNjyzHksBit2y/DckDwKFF+06eynVBQMR5/g8r5sIQcvgMvy2Ik2Bxlou+3on00QDVI34fG2YhwFOJTY8sx5LAYrdsvw3JA8ChRftOnsp1QUDEef4PK+bCEHL4DL8tiJNgcZaLvt6J9NEA1Td+HxtmIcBDiU2PLMeSwGK3bL8NyQPAoUX7Tq7KdUFA';
      audio.play().catch((e) => console.warn('Sound play failed:', e));
    } catch (e) {
      console.warn('Could not play notification sound:', e);
    }
  }

  /**
   * Enable/disable notifications
   * @param {boolean} enabled - Enable state
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    chrome.storage.local.set({ notificationsEnabled: enabled });
  }

  /**
   * Enable/disable sound
   * @param {boolean} enabled - Enable state
   */
  setSoundEnabled(enabled) {
    this.soundEnabled = enabled;
    chrome.storage.local.set({ notificationSound: enabled });
  }
}

// Singleton instance
export const notifications = new NotificationManager();
