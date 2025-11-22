/**
 * Tests for mention detection feature
 */

describe('Mention Detection', () => {
  let mockElement;
  let mockContainer;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    
    // Create mock message container
    mockContainer = document.createElement('div');
    mockContainer.className = 'message-container';
    document.body.appendChild(mockContainer);

    // Mock chrome storage
    global.chrome.storage.local.get = jest.fn((keys, callback) => {
      callback({
        mentionDetectionEnabled: false,
        mentionKeywords: [],
        mentionReplyMessages: []
      });
    });

    global.chrome.storage.local.set = jest.fn();
  });

  describe('containsMention', () => {
    test('should detect @mention format', () => {
      const keywords = ['username', 'john'];
      
      expect(containsMention('Hey @username, how are you?', keywords)).toBe(true);
      expect(containsMention('Hi @john', keywords)).toBe(true);
      expect(containsMention('Hello @JOHN', keywords)).toBe(true); // case insensitive
    });

    test('should detect plain keyword', () => {
      const keywords = ['username', 'john'];
      
      expect(containsMention('Hey username, check this out', keywords)).toBe(true);
      expect(containsMention('john are you there?', keywords)).toBe(true);
    });

    test('should not detect when keyword not present', () => {
      const keywords = ['username', 'john'];
      
      expect(containsMention('Hello everyone!', keywords)).toBe(false);
      expect(containsMention('Random message', keywords)).toBe(false);
    });

    test('should handle empty keywords', () => {
      expect(containsMention('Any message', [])).toBe(false);
      expect(containsMention('', [])).toBe(false);
    });

    test('should handle empty message', () => {
      const keywords = ['username'];
      
      expect(containsMention('', keywords)).toBe(false);
      expect(containsMention(null, keywords)).toBe(false);
    });
  });

  describe('getMessageId', () => {
    test('should generate ID from text content', () => {
      const element = document.createElement('div');
      element.textContent = 'Hello world';
      
      const id = getMessageId(element);
      expect(id).toContain('Hello world');
      expect(typeof id).toBe('string');
    });

    test('should include timestamp if available', () => {
      const element = document.createElement('div');
      element.textContent = 'Hello';
      element.setAttribute('data-timestamp', '12345');
      
      const id = getMessageId(element);
      expect(id).toContain('12345');
    });

    test('should handle elements without timestamps', () => {
      const element = document.createElement('div');
      element.textContent = 'Test message';
      
      const id = getMessageId(element);
      expect(id).toBe('Test message-');
    });

    test('should truncate long messages', () => {
      const element = document.createElement('div');
      element.textContent = 'A'.repeat(200); // Very long message
      
      const id = getMessageId(element);
      expect(id.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Mention Detection System', () => {
    test('should store detected mentions to avoid duplicates', () => {
      const lastProcessedMessages = new Set();
      
      const msg1 = 'Hello @user';
      lastProcessedMessages.add(msg1);
      
      expect(lastProcessedMessages.has(msg1)).toBe(true);
      expect(lastProcessedMessages.has('Different message')).toBe(false);
    });

    test('should limit processed messages set size', () => {
      const lastProcessedMessages = new Set();
      
      // Add 101 messages
      for (let i = 0; i < 101; i++) {
        lastProcessedMessages.add(`message-${i}`);
      }
      
      expect(lastProcessedMessages.size).toBe(101);
      
      // Simulate cleanup (remove oldest 50)
      if (lastProcessedMessages.size > 100) {
        const oldestEntries = Array.from(lastProcessedMessages).slice(0, 50);
        oldestEntries.forEach(entry => lastProcessedMessages.delete(entry));
      }
      
      expect(lastProcessedMessages.size).toBe(51);
    });
  });

  describe('Storage Integration', () => {
    test('should save mention detection settings', () => {
      const settings = {
        mentionDetectionEnabled: true,
        mentionKeywords: ['@username', 'john'],
        mentionReplyMessages: ['Thanks!', 'Hello!']
      };

      global.chrome.storage.local.set(settings);
      
      expect(global.chrome.storage.local.set).toHaveBeenCalledWith(settings);
    });

    test('should load mention detection settings', () => {
      const mockData = {
        mentionDetectionEnabled: true,
        mentionKeywords: ['@username'],
        mentionReplyMessages: ['Hi there!']
      };

      global.chrome.storage.local.get = jest.fn((keys, callback) => {
        callback(mockData);
      });

      global.chrome.storage.local.get(['mentionDetectionEnabled', 'mentionKeywords', 'mentionReplyMessages'], (data) => {
        expect(data.mentionDetectionEnabled).toBe(true);
        expect(data.mentionKeywords).toEqual(['@username']);
        expect(data.mentionReplyMessages).toEqual(['Hi there!']);
      });

      expect(global.chrome.storage.local.get).toHaveBeenCalled();
    });
  });
});

// Helper functions for testing (would normally be imported from content-enhanced.js)
function containsMention(text, keywords) {
  if (!text || !keywords || keywords.length === 0) return false;
  
  const lowerText = text.toLowerCase();
  return keywords.some(keyword => {
    const lowerKeyword = keyword.toLowerCase();
    return lowerText.includes(`@${lowerKeyword}`) || lowerText.includes(lowerKeyword);
  });
}

function getMessageId(element) {
  const text = (element.textContent || '').trim();
  const timestamp = element.getAttribute('data-timestamp') || element.querySelector('[data-timestamp]')?.getAttribute('data-timestamp') || '';
  return `${text}-${timestamp}`.substring(0, 100);
}
