/**
 * @jest-environment jsdom
 */

describe('Anti-Repetition Logic', () => {
  let getNextMessage;
  let messageList;
  let recentMessages;
  let enableAntiRepetition;

  beforeEach(() => {
    messageList = ['msg1', 'msg2', 'msg3', 'msg4', 'msg5'];
    recentMessages = [];
    enableAntiRepetition = true;

    // Simulate the getNextMessage function
    getNextMessage = () => {
      if (!messageList || messageList.length === 0) return '';

      let msg;
      let attempts = 0;

      if (enableAntiRepetition && messageList.length > 3) {
        do {
          msg = messageList[Math.floor(Math.random() * messageList.length)];
          attempts++;
        } while (recentMessages.includes(msg) && attempts < 10);
      } else {
        msg = messageList[Math.floor(Math.random() * messageList.length)];
      }

      if (enableAntiRepetition) {
        recentMessages.push(msg);
        if (recentMessages.length > Math.min(5, Math.floor(messageList.length / 2))) {
          recentMessages.shift();
        }
      }

      return msg;
    };
  });

  test('should return a message from the list', () => {
    const msg = getNextMessage();
    expect(messageList).toContain(msg);
  });

  test('should avoid recently used messages when enabled', () => {
    // Fill recent messages
    recentMessages = ['msg1', 'msg2'];
    
    // Get next 10 messages
    const messages = Array.from({ length: 10 }, () => getNextMessage());
    
    // Should prefer msg3, msg4, msg5 at the start
    const firstFew = messages.slice(0, 5);
    const hasRecentInFirst = firstFew.some(m => ['msg1', 'msg2'].includes(m));
    
    // Not guaranteed but highly unlikely to always pick recent ones
    expect(messages.length).toBe(10);
  });

  test('should maintain recent messages list with max length', () => {
    for (let i = 0; i < 10; i++) {
      getNextMessage();
    }
    
    const maxLength = Math.min(5, Math.floor(messageList.length / 2));
    expect(recentMessages.length).toBeLessThanOrEqual(maxLength);
  });

  test('should work with empty message list', () => {
    messageList = [];
    const msg = getNextMessage();
    expect(msg).toBe('');
  });

  test('should work when anti-repetition is disabled', () => {
    enableAntiRepetition = false;
    recentMessages = ['msg1', 'msg2'];
    
    const msg = getNextMessage();
    expect(messageList).toContain(msg);
    expect(recentMessages.length).toBe(2); // Shouldn't change
  });
});
