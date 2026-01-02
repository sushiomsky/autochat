/**
 * Tests for Form Validation UI Component
 */

describe('Form Validation', () => {
  let validateForm;
  let validateIntervalInputs;
  let validateMessageList;

  beforeEach(() => {
    // Setup DOM with form elements
    document.body.innerHTML = `
      <form id="autoSendForm">
        <textarea id="messageList" placeholder="Enter messages..."></textarea>
        
        <label>Send Mode:
          <select id="sendMode">
            <option value="once">Send Once</option>
            <option value="repeat">Repeat</option>
            <option value="random">Random Intervals</option>
          </select>
        </label>
        
        <div class="interval-inputs">
          <label>Min Interval (minutes):
            <input id="minInterval" type="number" min="1" max="1440" value="1">
          </label>
          <label>Max Interval (minutes):
            <input id="maxInterval" type="number" min="1" max="1440" value="2">
          </label>
        </div>
        
        <label>Daily Limit:
          <input id="dailyLimit" type="number" min="0" max="10000" value="100">
        </label>
        
        <label>Active Hours Start:
          <input id="activeHoursStart" type="time" value="09:00">
        </label>
        <label>Active Hours End:
          <input id="activeHoursEnd" type="time" value="17:00">
        </label>
        
        <button id="startAutoSend" type="button">Start Auto-Send</button>
      </form>
    `;

    // Define validation functions
    validateMessageList = function(messages) {
      if (!messages || messages.trim() === '') {
        return { valid: false, error: 'Please add at least one message' };
      }
      
      const lines = messages.trim().split('\n').filter(line => line.trim() !== '');
      if (lines.length === 0) {
        return { valid: false, error: 'Please add at least one message' };
      }
      
      return { valid: true, messages: lines };
    };

    validateIntervalInputs = function(minInterval, maxInterval) {
      const min = parseInt(minInterval, 10);
      const max = parseInt(maxInterval, 10);
      
      if (isNaN(min) || isNaN(max)) {
        return { valid: false, error: 'Intervals must be valid numbers' };
      }
      
      if (min < 1 || max < 1) {
        return { valid: false, error: 'Intervals must be at least 1 minute' };
      }
      
      if (min > 1440 || max > 1440) {
        return { valid: false, error: 'Intervals cannot exceed 1440 minutes (24 hours)' };
      }
      
      if (min > max) {
        return { valid: false, error: 'Minimum interval cannot be greater than maximum interval' };
      }
      
      return { valid: true };
    };

    validateForm = function() {
      const messageList = document.getElementById('messageList').value;
      const minInterval = document.getElementById('minInterval').value;
      const maxInterval = document.getElementById('maxInterval').value;
      
      // Validate messages
      const messageValidation = validateMessageList(messageList);
      if (!messageValidation.valid) {
        return messageValidation;
      }
      
      // Validate intervals
      const intervalValidation = validateIntervalInputs(minInterval, maxInterval);
      if (!intervalValidation.valid) {
        return intervalValidation;
      }
      
      return { valid: true };
    };
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Message List Validation', () => {
    test('should reject empty message list', () => {
      const result = validateMessageList('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Please add at least one message');
    });

    test('should reject whitespace-only message list', () => {
      const result = validateMessageList('   \n  \n  ');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Please add at least one message');
    });

    test('should accept single message', () => {
      const result = validateMessageList('Hello world');
      expect(result.valid).toBe(true);
      expect(result.messages).toEqual(['Hello world']);
    });

    test('should accept multiple messages', () => {
      const result = validateMessageList('Hello\nHow are you?\nGoodbye');
      expect(result.valid).toBe(true);
      expect(result.messages).toEqual(['Hello', 'How are you?', 'Goodbye']);
    });

    test('should filter out empty lines', () => {
      const result = validateMessageList('Hello\n\nWorld\n\n');
      expect(result.valid).toBe(true);
      expect(result.messages).toEqual(['Hello', 'World']);
    });

    test('should trim whitespace from messages', () => {
      const result = validateMessageList('  Hello  \n  World  ');
      expect(result.valid).toBe(true);
      expect(result.messages.length).toBe(2);
    });

    test('should handle messages with special characters', () => {
      const result = validateMessageList('Hello! 🎉\n{time} - Nice to meet you');
      expect(result.valid).toBe(true);
      expect(result.messages.length).toBe(2);
    });
  });

  describe('Interval Validation', () => {
    test('should accept valid interval range', () => {
      const result = validateIntervalInputs('1', '10');
      expect(result.valid).toBe(true);
    });

    test('should accept equal min and max intervals', () => {
      const result = validateIntervalInputs('5', '5');
      expect(result.valid).toBe(true);
    });

    test('should reject min greater than max', () => {
      const result = validateIntervalInputs('10', '5');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Minimum interval cannot be greater than maximum interval');
    });

    test('should reject intervals less than 1', () => {
      const result = validateIntervalInputs('0', '5');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Intervals must be at least 1 minute');
    });

    test('should reject negative intervals', () => {
      const result = validateIntervalInputs('-5', '10');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Intervals must be at least 1 minute');
    });

    test('should reject intervals greater than 1440', () => {
      const result = validateIntervalInputs('1', '1500');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Intervals cannot exceed 1440 minutes (24 hours)');
    });

    test('should accept maximum valid interval (1440)', () => {
      const result = validateIntervalInputs('1', '1440');
      expect(result.valid).toBe(true);
    });

    test('should reject non-numeric intervals', () => {
      const result = validateIntervalInputs('abc', '10');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Intervals must be valid numbers');
    });

    test('should reject empty interval values', () => {
      const result = validateIntervalInputs('', '10');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Intervals must be valid numbers');
    });
  });

  describe('Complete Form Validation', () => {
    test('should validate complete valid form', () => {
      document.getElementById('messageList').value = 'Hello\nWorld';
      document.getElementById('minInterval').value = '1';
      document.getElementById('maxInterval').value = '5';
      
      const result = validateForm();
      expect(result.valid).toBe(true);
    });

    test('should reject form with empty messages', () => {
      document.getElementById('messageList').value = '';
      document.getElementById('minInterval').value = '1';
      document.getElementById('maxInterval').value = '5';
      
      const result = validateForm();
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Please add at least one message');
    });

    test('should reject form with invalid intervals', () => {
      document.getElementById('messageList').value = 'Hello';
      document.getElementById('minInterval').value = '10';
      document.getElementById('maxInterval').value = '5';
      
      const result = validateForm();
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Minimum interval cannot be greater than maximum interval');
    });
  });

  describe('Input Field Constraints', () => {
    test('should have min/max attributes on interval inputs', () => {
      const minInput = document.getElementById('minInterval');
      const maxInput = document.getElementById('maxInterval');
      
      expect(minInput.getAttribute('min')).toBe('1');
      expect(minInput.getAttribute('max')).toBe('1440');
      expect(maxInput.getAttribute('min')).toBe('1');
      expect(maxInput.getAttribute('max')).toBe('1440');
    });

    test('should have type="number" for numeric inputs', () => {
      const minInput = document.getElementById('minInterval');
      const maxInput = document.getElementById('maxInterval');
      const dailyLimit = document.getElementById('dailyLimit');
      
      expect(minInput.type).toBe('number');
      expect(maxInput.type).toBe('number');
      expect(dailyLimit.type).toBe('number');
    });

    test('should have type="time" for time inputs', () => {
      const startTime = document.getElementById('activeHoursStart');
      const endTime = document.getElementById('activeHoursEnd');
      
      expect(startTime.type).toBe('time');
      expect(endTime.type).toBe('time');
    });
  });

  describe('Real-time Validation', () => {
    test('should validate on input change', () => {
      const minInput = document.getElementById('minInterval');
      const maxInput = document.getElementById('maxInterval');
      
      minInput.value = '10';
      maxInput.value = '5';
      
      const result = validateIntervalInputs(minInput.value, maxInput.value);
      expect(result.valid).toBe(false);
    });

    test('should show valid state when inputs are corrected', () => {
      const minInput = document.getElementById('minInterval');
      const maxInput = document.getElementById('maxInterval');
      
      minInput.value = '10';
      maxInput.value = '5';
      
      let result = validateIntervalInputs(minInput.value, maxInput.value);
      expect(result.valid).toBe(false);
      
      minInput.value = '5';
      result = validateIntervalInputs(minInput.value, maxInput.value);
      expect(result.valid).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('should handle very large daily limit', () => {
      const dailyLimit = document.getElementById('dailyLimit');
      dailyLimit.value = '10000';
      expect(dailyLimit.value).toBe('10000');
    });

    test('should handle messages with newlines and special formatting', () => {
      const messages = 'Line 1\nLine 2\r\nLine 3';
      const result = validateMessageList(messages);
      expect(result.valid).toBe(true);
      expect(result.messages.length).toBeGreaterThan(0);
    });

    test('should handle single character message', () => {
      const result = validateMessageList('a');
      expect(result.valid).toBe(true);
      expect(result.messages).toEqual(['a']);
    });

    test('should handle very long message', () => {
      const longMessage = 'a'.repeat(1000);
      const result = validateMessageList(longMessage);
      expect(result.valid).toBe(true);
      expect(result.messages[0].length).toBe(1000);
    });
  });

  describe('Default Values', () => {
    test('should have default values set', () => {
      expect(document.getElementById('minInterval').value).toBe('1');
      expect(document.getElementById('maxInterval').value).toBe('2');
      expect(document.getElementById('dailyLimit').value).toBe('100');
      expect(document.getElementById('activeHoursStart').value).toBe('09:00');
      expect(document.getElementById('activeHoursEnd').value).toBe('17:00');
    });

    test('should validate with default values', () => {
      document.getElementById('messageList').value = 'Test message';
      const result = validateForm();
      expect(result.valid).toBe(true);
    });
  });
});
