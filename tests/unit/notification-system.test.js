/**
 * Tests for Notification System UI Component
 */

describe('Notification System', () => {
  let showNotification;
  let notificationElement;
  let hideTimeout;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div id="notification" class="notification"></div>
    `;

    notificationElement = document.getElementById('notification');
    hideTimeout = null;

    // Define showNotification function (from popup-enhanced.js)
    showNotification = function (message, isSuccess = true) {
      const notification = document.getElementById('notification');
      if (notification) {
        notification.textContent = message;
        notification.className = 'notification';
        notification.classList.add(isSuccess ? 'success' : 'error');
        notification.classList.add('show');
        notification.style.display = 'block';
        if (hideTimeout) {
          clearTimeout(hideTimeout);
        }
        hideTimeout = setTimeout(() => {
          notification.classList.remove('show');
          notification.style.display = 'none';
        }, 3000);
      }
    };
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllTimers();
  });

  describe('Success Notifications', () => {
    test('should display success notification', () => {
      showNotification('Operation completed successfully', true);

      expect(notificationElement.textContent).toBe('Operation completed successfully');
      expect(notificationElement.classList.contains('success')).toBe(true);
      expect(notificationElement.classList.contains('show')).toBe(true);
    });

    test('should use success class by default', () => {
      showNotification('Default notification');

      expect(notificationElement.classList.contains('success')).toBe(true);
      expect(notificationElement.classList.contains('error')).toBe(false);
    });

    test('should display multiple success messages', () => {
      const messages = ['First success', 'Second success', 'Third success'];

      messages.forEach((message) => {
        showNotification(message, true);
        expect(notificationElement.textContent).toBe(message);
      });
    });
  });

  describe('Error Notifications', () => {
    test('should display error notification', () => {
      showNotification('An error occurred', false);

      expect(notificationElement.textContent).toBe('An error occurred');
      expect(notificationElement.classList.contains('error')).toBe(true);
      expect(notificationElement.classList.contains('success')).toBe(false);
      expect(notificationElement.classList.contains('show')).toBe(true);
    });

    test('should switch from success to error', () => {
      showNotification('Success message', true);
      expect(notificationElement.classList.contains('success')).toBe(true);

      showNotification('Error message', false);
      expect(notificationElement.classList.contains('error')).toBe(true);
      expect(notificationElement.classList.contains('success')).toBe(false);
    });
  });

  describe('Notification Auto-Hide', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should hide notification after 3 seconds', () => {
      showNotification('Temporary message');
      expect(notificationElement.classList.contains('show')).toBe(true);

      jest.advanceTimersByTime(3000);
      expect(notificationElement.classList.contains('show')).toBe(false);
    });

    test('should not hide before timeout', () => {
      showNotification('Temporary message');
      expect(notificationElement.classList.contains('show')).toBe(true);

      jest.advanceTimersByTime(2000);
      expect(notificationElement.classList.contains('show')).toBe(true);
    });

    test('should reset timeout when new notification is shown', () => {
      showNotification('First message');
      jest.advanceTimersByTime(2000);

      showNotification('Second message');
      expect(notificationElement.textContent).toBe('Second message');
      expect(notificationElement.classList.contains('show')).toBe(true);

      jest.advanceTimersByTime(2000);
      expect(notificationElement.classList.contains('show')).toBe(true);

      jest.advanceTimersByTime(1000);
      expect(notificationElement.classList.contains('show')).toBe(false);
    });
  });

  describe('Empty and Special Messages', () => {
    test('should handle empty message', () => {
      showNotification('');
      expect(notificationElement.textContent).toBe('');
      expect(notificationElement.style.display).toBe('block');
    });

    test('should handle long message', () => {
      const longMessage =
        'This is a very long notification message that contains a lot of text to test how the notification system handles lengthy content.';
      showNotification(longMessage);
      expect(notificationElement.textContent).toBe(longMessage);
    });

    test('should handle special characters', () => {
      const specialMessage =
        'Success! 🎉 Operation completed @ 100% <script>alert("test")</script>';
      showNotification(specialMessage);
      expect(notificationElement.textContent).toBe(specialMessage);
    });

    test('should handle HTML entities', () => {
      const htmlMessage = '<strong>Bold</strong> &amp; <em>italic</em>';
      showNotification(htmlMessage);
      expect(notificationElement.textContent).toBe(htmlMessage);
    });
  });

  describe('Notification Element Missing', () => {
    test('should handle missing notification element gracefully', () => {
      document.body.innerHTML = '';

      expect(() => {
        showNotification('Test message');
      }).not.toThrow();
    });
  });

  describe('Notification Styling', () => {
    test('should apply base notification class', () => {
      showNotification('Test');
      expect(notificationElement.classList.contains('notification')).toBe(true);
    });

    test('should update classes when showing new notification', () => {
      showNotification('Success', true);
      expect(notificationElement.classList.contains('success')).toBe(true);
      expect(notificationElement.classList.contains('show')).toBe(true);

      showNotification('Error', false);
      expect(notificationElement.classList.contains('error')).toBe(true);
      expect(notificationElement.classList.contains('show')).toBe(true);
    });
  });

  describe('Rapid Notification Updates', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should handle rapid successive notifications', () => {
      for (let i = 0; i < 10; i++) {
        showNotification(`Message ${i}`);
      }

      expect(notificationElement.textContent).toBe('Message 9');
      expect(notificationElement.style.display).toBe('block');
    });

    test('should display latest notification when multiple are shown quickly', () => {
      showNotification('First', true);
      showNotification('Second', false);
      showNotification('Third', true);

      expect(notificationElement.textContent).toBe('Third');
      expect(notificationElement.classList.contains('success')).toBe(true);
    });
  });

  describe('Notification Visibility State', () => {
    test('should be hidden initially', () => {
      expect(notificationElement.style.display).toBe('');
    });

    test('should become visible when notification is shown', () => {
      showNotification('Test');
      expect(notificationElement.style.display).toBe('block');
    });

    test('should be hidden after showing and timeout', () => {
      jest.useFakeTimers();
      showNotification('Test');
      expect(notificationElement.style.display).toBe('block');

      jest.advanceTimersByTime(3000);
      expect(notificationElement.style.display).toBe('none');
      jest.useRealTimers();
    });
  });

  describe('Common Use Cases', () => {
    test('should show success notification for saved settings', () => {
      showNotification('Settings saved successfully', true);
      expect(notificationElement.textContent).toBe('Settings saved successfully');
      expect(notificationElement.classList.contains('success')).toBe(true);
    });

    test('should show error notification for validation failure', () => {
      showNotification('Please fill in all required fields', false);
      expect(notificationElement.textContent).toBe('Please fill in all required fields');
      expect(notificationElement.classList.contains('error')).toBe(true);
    });

    test('should show success notification for auto-send started', () => {
      showNotification('Auto-send started successfully', true);
      expect(notificationElement.textContent).toBe('Auto-send started successfully');
    });

    test('should show error notification for no messages', () => {
      showNotification('Please add at least one message', false);
      expect(notificationElement.textContent).toBe('Please add at least one message');
    });
  });
});
