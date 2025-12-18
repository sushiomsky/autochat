/* manual-detection.test.js — Tests for Manual Message Detection */

describe('ManualMessageDetector', () => {
  let ManualMessageDetector;
  let detector;
  let mockCallback;

  beforeEach(() => {
    // Set up DOM
    document.body.innerHTML = `
      <input type="text" id="test-input" value="" />
      <div contenteditable="true" id="test-contenteditable"></div>
    `;

    // Import module
    ManualMessageDetector = require('../../src/manual-detection');
    detector = new ManualMessageDetector();
    mockCallback = jest.fn();

    // Clear timers
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    if (detector.isMonitoring) {
      detector.stopMonitoring();
    }
    jest.useRealTimers();
  });

  describe('startMonitoring', () => {
    test('should start monitoring input field', () => {
      detector.startMonitoring('#test-input', mockCallback);

      expect(detector.isMonitoring).toBe(true);
      expect(detector.inputObserver).not.toBeNull();
    });

    test('should not start with invalid selector', () => {
      detector.startMonitoring('#nonexistent', mockCallback);

      expect(detector.isMonitoring).toBe(false);
    });

    test('should not start if already monitoring', () => {
      detector.startMonitoring('#test-input', mockCallback);
      const firstObserver = detector.inputObserver;

      detector.startMonitoring('#test-input', mockCallback);

      expect(detector.inputObserver).toBe(firstObserver);
    });

    test('should attach event listeners', () => {
      const input = document.getElementById('test-input');
      const addEventListenerSpy = jest.spyOn(input, 'addEventListener');

      detector.startMonitoring('#test-input', mockCallback);

      expect(addEventListenerSpy).toHaveBeenCalledWith('input', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });
  });

  describe('stopMonitoring', () => {
    test('should stop monitoring and clean up', () => {
      detector.startMonitoring('#test-input', mockCallback);
      detector.stopMonitoring();

      expect(detector.isMonitoring).toBe(false);
      expect(detector.inputObserver).toBeNull();
    });

    test('should remove event listeners', () => {
      const input = document.getElementById('test-input');
      detector.startMonitoring('#test-input', mockCallback);

      const removeEventListenerSpy = jest.spyOn(input, 'removeEventListener');
      detector.stopMonitoring();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('input', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });
  });

  describe('checkForManualSend', () => {
    test('should detect manual send when input is cleared', () => {
      const input = document.getElementById('test-input');
      detector.startMonitoring('#test-input', mockCallback);

      // Simulate typing
      input.value = 'Hello World';
      detector.lastInputValue = 'Hello World';

      // Simulate send (input cleared)
      input.value = '';
      detector.checkForManualSend();

      expect(mockCallback).toHaveBeenCalledWith({
        text: 'Hello World',
        timestamp: expect.any(String),
      });
    });

    test('should not detect when input has text', () => {
      const input = document.getElementById('test-input');
      detector.startMonitoring('#test-input', mockCallback);

      input.value = 'Hello';
      detector.lastInputValue = 'Hello';

      input.value = 'Hello World';
      detector.checkForManualSend();

      expect(mockCallback).not.toHaveBeenCalled();
    });

    test('should not detect automated messages', () => {
      const input = document.getElementById('test-input');
      detector.startMonitoring('#test-input', mockCallback);

      // Mark as automated
      detector.markAsAutomated('Automated message');

      // Simulate input
      input.value = 'Automated message';
      detector.lastInputValue = 'Automated message';

      // Clear input
      input.value = '';
      detector.checkForManualSend();

      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('getInputValue', () => {
    test('should get value from input element', () => {
      const input = document.getElementById('test-input');
      input.value = 'Test Value';

      const value = detector.getInputValue(input);

      expect(value).toBe('Test Value');
    });

    test('should get text from contenteditable element', () => {
      const contentEditable = document.getElementById('test-contenteditable');
      contentEditable.textContent = 'Test Content';

      const value = detector.getInputValue(contentEditable);

      expect(value).toBe('Test Content');
    });

    test('should return empty string for null element', () => {
      const value = detector.getInputValue(null);

      expect(value).toBe('');
    });
  });

  describe('markAsAutomated', () => {
    test('should mark message as automated', () => {
      detector.markAsAutomated('Test message');

      expect(detector.recentAutomatedMessages.has('Test message')).toBe(true);
    });

    test('should remove automated mark after timeout', () => {
      detector.markAsAutomated('Test message');

      expect(detector.recentAutomatedMessages.has('Test message')).toBe(true);

      // Fast-forward time
      jest.advanceTimersByTime(10001);

      expect(detector.recentAutomatedMessages.has('Test message')).toBe(false);
    });

    test('should trim message text', () => {
      detector.markAsAutomated('  Test message  ');

      expect(detector.recentAutomatedMessages.has('Test message')).toBe(true);
    });
  });

  describe('updateInputSelector', () => {
    test('should update selector while monitoring', () => {
      detector.startMonitoring('#test-input', mockCallback);

      detector.updateInputSelector('#test-contenteditable');

      expect(detector.inputSelector).toBe('#test-contenteditable');
      expect(detector.isMonitoring).toBe(true);
    });

    test('should restart monitoring with new selector', () => {
      detector.startMonitoring('#test-input', mockCallback);
      const stopSpy = jest.spyOn(detector, 'stopMonitoring');
      const startSpy = jest.spyOn(detector, 'startMonitoring');

      detector.updateInputSelector('#test-contenteditable');

      expect(stopSpy).toHaveBeenCalled();
      expect(startSpy).toHaveBeenCalledWith('#test-contenteditable', mockCallback);
    });
  });

  describe('Enter key detection', () => {
    test('should detect Enter key press', () => {
      const input = document.getElementById('test-input');
      detector.startMonitoring('#test-input', mockCallback);

      input.value = 'Test message';
      detector.lastInputValue = 'Test message';

      // Simulate Enter key
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      input.dispatchEvent(event);

      // Clear input (simulating send)
      input.value = '';

      // Advance timers for debounced check
      jest.advanceTimersByTime(600);

      expect(mockCallback).toHaveBeenCalled();
    });

    test('should not trigger on Shift+Enter', () => {
      const input = document.getElementById('test-input');
      detector.startMonitoring('#test-input', mockCallback);

      input.value = 'Test message';
      detector.lastInputValue = 'Test message';

      // Simulate Shift+Enter
      const event = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true });
      input.dispatchEvent(event);

      jest.advanceTimersByTime(600);

      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('scheduleCheck', () => {
    test('should debounce checks', () => {
      detector.startMonitoring('#test-input', mockCallback);
      const checkSpy = jest.spyOn(detector, 'checkForManualSend');

      // Schedule multiple checks
      detector.scheduleCheck();
      detector.scheduleCheck();
      detector.scheduleCheck();

      // Advance timers
      jest.advanceTimersByTime(100);

      // Should only check once
      expect(checkSpy).toHaveBeenCalledTimes(1);
    });

    test('should respect custom delay', () => {
      detector.startMonitoring('#test-input', mockCallback);
      const checkSpy = jest.spyOn(detector, 'checkForManualSend');

      detector.scheduleCheck(500);

      jest.advanceTimersByTime(400);
      expect(checkSpy).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);
      expect(checkSpy).toHaveBeenCalled();
    });
  });
});
