/**
 * Browser Notifications Module
 * Handles desktop notifications for events
 */

export class NotificationManager {
  constructor() {
    this.enabled = true;
    this.soundEnabled = true;
    this.loadSettings();
  }

  /**
   * Load notification settings from storage
   */
  async loadSettings() {
    const data = await chrome.storage.local.get(['notificationsEnabled', 'notificationSound']);
    this.enabled = data.notificationsEnabled !== false;
    this.soundEnabled = data.notificationSound !== false;
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
    if (!this.enabled) return;

    const hasPermission = await this.requestPermission();
    if (!hasPermission) return;

    const notification = new Notification(title, {
      icon: chrome.runtime.getURL('icon48.png'),
      badge: chrome.runtime.getURL('icon16.png'),
      ...options
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
   * Show message sent notification
   * @param {number} count - Number of messages sent
   */
  async notifyMessageSent(count = 1) {
    await this.show('AutoChat', {
      body: `Message${count > 1 ? 's' : ''} sent successfully! (Total: ${count})`,
      tag: 'message-sent',
      icon: chrome.runtime.getURL('icon48.png')
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
      requireInteraction: true
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
      requireInteraction: true
    });
  }

  /**
   * Show auto-send started notification
   */
  async notifyAutoSendStarted() {
    await this.show('AutoChat Started', {
      body: 'Auto-send is now active',
      tag: 'auto-send-started'
    });
  }

  /**
   * Show auto-send stopped notification
   */
  async notifyAutoSendStopped() {
    await this.show('AutoChat Stopped', {
      body: 'Auto-send has been stopped',
      tag: 'auto-send-stopped'
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
      requireInteraction: true
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
      audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYHGWi77eifTRAMUKfi8LdjHAU4ktjyzHksBSN2yPDekTwKFF+z6uyoVRQLRp/h8r5sIQYtgMzy2Ik2Bxlou+3on00QDVG34vC3YhwFOJLY8s15KwUldsrw3ZE8ChRfs+rsp1UUDUZ/4fK/bSEHLYDM8tmJNgcZaLzs6J9NEA1Rt+Lxt2IcBziS2PLNeSsFJXbK8N2RPAoUX7Pq7KhVFA1Gf+HyvmwhBy2AzPLZiTYHGWi77OifTRAMUbfi8LdjHAU4ktfyzHksBSh1y/DdkTwKFF+z6+ynVRQNRp/g8r9sIQcqf8zy2Ik2Bxlou+3on0wQDVG24vC3YhwFOJPY8sx5LAYqdsrw3ZA8ChRfs+rsp1QUDUaf4PK+bCEHLX/L8tiJNgcZaLvt6J9NEAxStuLwtmIcBTiT2PLMeSwGKnbK8N2QPAoUX7Tp7KdUFA1Gn+DyvmshBy+Ay/LYiTYHGWi77eifTRAMUzfh8bZiHAU4lNjyzHksBit2yvDdkDwKFF+06eymVBQNRp/g8r5sIQYvgMry2Ik2Bxlou+3on00QDFI34fG2YhwFOJPY8sx5LAUsdsvw3JA8ChRftOnsp1QUDUaf4PK+bCEHL4DL8tiJNggZaLrt6J9NEAxTN+HxtmIcBTiU2PLMeSwGK3bL8NyQPAoUYLTp7KdUFAxGn+DyvmwhBy+Ay/LYiTYHGWi77eifTRAMUzfh8bZiHAU4lNjyzHksBSt2y/DckDwKFF+06eynVBQMR5/g8r5sIQcvgMvy2Ik2Bxlou+3on00QDFI34fG2YhwFOJTY8sx5LAUrdsvw3JA8ChRftOnsp1QUDEef4PK+bCEHL4DL8tiJNgcZaLrt6J9NEAxTN+HxtmIcBTiU2PLMeSwGK3bL8NyQPAoUX7Tq7KdUFAxHn+DyvmwhBy+Ay/LYiTYHGWi77eifTRAMUzfh8bZiHAU4lNjyzHksBit2y/DckDwKFF+06eynVBQMR5/g8r5sIQcvgMvy2Ik2Bxlou+3on00QDFI34fG2YhwFOJTY8sx5LAYrdsvw3JA8ChRftOnsp1QUDEef4PK+bCEHL4DL8tiJNgcZaLvt6J9NEAxTN+HxtmIcBTiU2PLMeSwGK3bL8NyQPAoUX7Tq7KdUFAxHn+DyvmwhBy+Ay/LYiTYHGWi77eifTRANU3fh8bZiHAQ4lNjyzHksBit2y/DckDwKFF+06eynVBQMR5/g8r5sIQcvgMvy2Ik2Bxlou+3on00QDVI34fG2YhwFOJTY8sx5LAYrdsvw3JA8ChRftOnsp1QUDEef4PK+bCEHL4DL8tiJNgcZaLvt6J9NEA1Td+HxtmIcBDiU2PLMeSwGK3bL8NyQPAoUX7Tq7KdUFA';
      audio.play().catch(e => console.warn('Sound play failed:', e));
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
